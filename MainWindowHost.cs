using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json.Nodes;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Shell;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using MegaBox.Services;

namespace MegaBox;

public sealed class ViewerWindowHost : Grid
{
    private const uint WmNcLButtonDown = 0x00A1;
    private const int HitTestCaption = 2;

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);

    private readonly string _route;
    private readonly string? _itemId;
    private readonly string? _itemKind;
    private readonly WebView2 _webView = new();
    private LibraryStore? _store;

    public ViewerWindowHost(string route, string? itemId = null, string? itemKind = null)
    {
        _route = route;
        _itemId = itemId;
        _itemKind = itemKind;
        Children.Add(_webView);
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        DebugLog($"Host loaded: {_route}");
        try
        {
            _store = new LibraryStore();
            DebugLog($"Store ready: {_store.RootPath}");
            SeedDemoIfRequested(_store);
            var userData = Path.Combine(_store.RootPath, "webview");
            Directory.CreateDirectory(userData);
            var browserArguments = Environment.GetEnvironmentVariable("MEGABOX_WEBVIEW_ARGS");
            var options = string.IsNullOrWhiteSpace(browserArguments)
                ? null
                : new CoreWebView2EnvironmentOptions(browserArguments);
            var environment = await CoreWebView2Environment.CreateAsync(null, userData, options);
            await _webView.EnsureCoreWebView2Async(environment);

            var webRoot = Path.Combine(AppContext.BaseDirectory, "www");
            if (!Directory.Exists(webRoot))
            {
                webRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "www");
            }

            _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "app.megabox.local",
                webRoot,
                CoreWebView2HostResourceAccessKind.Allow);
            _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "assets.megabox.local",
                _store.RootPath,
                CoreWebView2HostResourceAccessKind.Allow);

            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = Debugger.IsAttached;
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            _webView.CoreWebView2.NavigationCompleted += OnNavigationCompleted;
            _webView.CoreWebView2.ProcessFailed += (_, args) =>
                DebugLog($"WebView process failed: {args.ProcessFailedKind}, reason={args.Reason}");

            var suffix = _route == "main"
                ? "?view=library"
                : $"?view={Uri.EscapeDataString(_route)}&kind={Uri.EscapeDataString(_itemKind ?? "")}&id={Uri.EscapeDataString(_itemId ?? "")}";
            DebugLog($"Web root: {webRoot}, exists={Directory.Exists(webRoot)}");
            if (Environment.GetEnvironmentVariable("MEGABOX_BLANK_TEST") == "1")
            {
                _webView.CoreWebView2.NavigateToString(
                    "<!doctype html><html><body style='background:#111;color:white'><h1>MegaBox WebView OK</h1></body></html>");
                DebugLog("Navigating: blank test");
            }
            else
            {
                _webView.CoreWebView2.Navigate("https://app.megabox.local/index.html" + suffix);
                DebugLog($"Navigating: {suffix}");
            }
        }
        catch (Exception ex)
        {
            DebugLog("Initialization failed: " + ex);
            var panel = new TextBlock
            {
                Text = "MegaBox 无法启动 WebView2。\n\n" + ex.Message,
                Foreground = System.Windows.Media.Brushes.White,
                Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(18, 20, 26)),
                Padding = new Thickness(32),
                FontSize = 15,
                TextWrapping = TextWrapping.Wrap
            };
            Children.Clear();
            Children.Add(panel);
        }
    }

    private async void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        DebugLog($"Navigation completed: success={e.IsSuccess}, status={e.WebErrorStatus}");
        var capturePath = Environment.GetEnvironmentVariable("MEGABOX_CAPTURE_PATH");
        if (string.IsNullOrWhiteSpace(capturePath) ||
            Window.GetWindow(this) != Application.Current.MainWindow)
        {
            return;
        }

        try
        {
            await Task.Delay(500);
            var automationScript = Environment.GetEnvironmentVariable("MEGABOX_CAPTURE_SCRIPT");
            if (!string.IsNullOrWhiteSpace(automationScript))
            {
                var automationResult = await _webView.CoreWebView2.ExecuteScriptAsync(automationScript);
                DebugLog("Automation result: " + automationResult);
                var configuredDelay = Environment.GetEnvironmentVariable("MEGABOX_CAPTURE_DELAY");
                var automationDelay = int.TryParse(configuredDelay, out var parsedDelay)
                    ? Math.Max(100, parsedDelay)
                    : 700;
                await Task.Delay(automationDelay);
            }
            else
            {
                await Task.Delay(400);
            }

            Directory.CreateDirectory(Path.GetDirectoryName(capturePath) ?? ".");
            await using var stream = File.Create(capturePath);
            await _webView.CoreWebView2.CapturePreviewAsync(
                CoreWebView2CapturePreviewImageFormat.Png,
                stream);

            var domDump = await _webView.CoreWebView2.ExecuteScriptAsync(
                "JSON.stringify({title:document.title,text:document.body.innerText.slice(0,2000),html:document.body.innerHTML.length})");
            await File.WriteAllTextAsync(capturePath + ".json", domDump);

            if (Environment.GetEnvironmentVariable("MEGABOX_CAPTURE_EXIT") == "1")
            {
                Application.Current.Shutdown();
            }
        }
        catch (Exception ex)
        {
            DebugLog("Capture failed: " + ex);
            await File.WriteAllTextAsync(capturePath + ".error.txt", ex.ToString());
            if (Environment.GetEnvironmentVariable("MEGABOX_CAPTURE_EXIT") == "1")
            {
                Application.Current.Shutdown();
            }
        }
    }

    private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        var raw = e.TryGetWebMessageAsString();
        JsonObject? request;
        try
        {
            request = JsonNode.Parse(raw)?.AsObject();
        }
        catch
        {
            return;
        }

        if (request is null)
        {
            return;
        }

        var requestId = request["requestId"]?.GetValue<string>() ?? "";
        var action = request["action"]?.GetValue<string>() ?? "";

        try
        {
            JsonNode? payload;
            if (action == "pdf.import")
            {
                payload = await HandlePdfImport(request, requestId);
            }
            else if (action == "files.import")
            {
                payload = await HandleFileImport(request, requestId);
            }
            else if (action == "upload.finish")
            {
                payload = await HandleUploadFinish(request, requestId);
            }
            else
            {
                payload = Handle(action, request);
            }
            Respond(new JsonObject
            {
                ["requestId"] = requestId,
                ["ok"] = true,
                ["payload"] = payload
            });
        }
        catch (Exception ex)
        {
            Respond(new JsonObject
            {
                ["requestId"] = requestId,
                ["ok"] = false,
                ["error"] = ex.Message
            });
        }
    }

    private async Task<JsonNode?> HandlePdfImport(JsonObject request, string requestId)
    {
        var store = _store ?? throw new InvalidOperationException("本地存储尚未初始化。");
        var owner = Window.GetWindow(this);
        var handle = owner is null ? IntPtr.Zero : new WindowInteropHelper(owner).Handle;
        return await store.ImportPdfAsync(
            handle,
            request["folderId"]?.GetValue<string>(),
            request["pageRange"]?.GetValue<string>() ?? "",
            request["dpi"]?.GetValue<int>() ?? 75,
            progress => SendPdfProgress(requestId, progress));
    }

    private async Task<JsonNode?> HandleFileImport(JsonObject request, string requestId)
    {
        var store = _store ?? throw new InvalidOperationException("本地存储尚未初始化。");
        var owner = Window.GetWindow(this);
        var handle = owner is null ? IntPtr.Zero : new WindowInteropHelper(owner).Handle;
        return await store.ImportFilesAsync(
            handle,
            request["folderId"]?.GetValue<string>(),
            progress => SendPdfProgress(requestId, progress));
    }

    private async Task<JsonNode?> HandleUploadFinish(JsonObject request, string requestId)
    {
        var store = _store ?? throw new InvalidOperationException("本地存储尚未初始化。");
        var result = await store.FinishUpload(
            request["uploadId"]?.GetValue<string>() ?? "",
            request["folderId"]?.GetValue<string>(),
            progress => SendPdfProgress(requestId, progress));
        if (result["count"] is not null)
        {
            return result;
        }
        return new JsonObject
        {
            ["items"] = result["items"]?.DeepClone() ?? new JsonArray(),
            ["count"] = result["count"]?.GetValue<int>() ?? 0
        };
    }

    private void SendPdfProgress(string requestId, PdfImportProgress progress)
    {
        if (!Dispatcher.CheckAccess())
        {
            Dispatcher.InvokeAsync(() => SendPdfProgress(requestId, progress));
            return;
        }
        try
        {
            _webView.CoreWebView2?.PostWebMessageAsJson(new JsonObject
            {
                ["requestId"] = requestId,
                ["progress"] = new JsonObject
                {
                    ["stage"] = progress.Stage,
                    ["current"] = progress.Current,
                    ["total"] = progress.Total,
                    ["pageNumber"] = progress.PageNumber
                }
            }.ToJsonString());
        }
        catch
        {
        }
    }

    private JsonNode? Handle(string action, JsonObject request)
    {
        var store = _store ?? throw new InvalidOperationException("本地存储尚未初始化。");
        switch (action)
        {
            case "library.get":
                return store.GetLibrary();
            case "asset.get":
                return store.GetAsset(request["id"]?.GetValue<string>() ?? "");
            case "board.get":
                return store.GetBoard(request["id"]?.GetValue<string>() ?? "");
            case "upload.begin":
                return store.BeginUpload(
                    request["name"]?.GetValue<string>() ?? "",
                    request["size"]?.GetValue<long>() ?? 0);
            case "upload.chunk":
                return store.AppendUpload(
                    request["uploadId"]?.GetValue<string>() ?? "",
                    request["data"]?.GetValue<string>() ?? "");
            case "upload.cancel":
                return store.CancelUpload(request["uploadId"]?.GetValue<string>() ?? "");
            case "board.create":
                return store.CreateBoard(
                    request["name"]?.GetValue<string>() ?? "",
                    request["assetIds"] as JsonArray,
                    request["folderId"]?.GetValue<string>());
            case "board.save":
                return store.SaveBoard(request["board"]?.DeepClone().AsObject()
                    ?? throw new InvalidOperationException("缺少画布数据。"));
            case "board.delete":
                return store.DeleteBoard(request["id"]?.GetValue<string>() ?? "");
            case "asset.update":
                return store.UpdateAsset(
                    request["id"]?.GetValue<string>() ?? "",
                    request["updates"]?.DeepClone().AsObject() ?? new JsonObject());
            case "asset.delete":
            {
                var assetId = request["id"]?.GetValue<string>() ?? "";
                var result = store.DeleteAsset(assetId);
                CloseWindowsForDeletedAsset(assetId, result["affectedBoardIds"] as JsonArray);
                return result;
            }
            case "folder.create":
                return store.CreateFolder(
                    request["name"]?.GetValue<string>() ?? "",
                    request["parentId"]?.GetValue<string>());
            case "folder.rename":
                return store.RenameFolder(
                    request["id"]?.GetValue<string>() ?? "",
                    request["name"]?.GetValue<string>() ?? "");
            case "folder.delete":
                return store.DeleteFolder(request["id"]?.GetValue<string>() ?? "");
            case "folder.move":
                return store.MoveFolder(
                    request["id"]?.GetValue<string>() ?? "",
                    request["parentId"]?.GetValue<string>());
            case "folders.reorder":
                return store.ReorderFolders(request["items"] as JsonArray ?? new JsonArray());
            case "items.assignFolder":
                return store.AssignItemsToFolder(
                    request["items"] as JsonArray ?? new JsonArray(),
                    request["folderId"]?.GetValue<string>());
            case "items.reorderFiles":
                return store.ReorderFiles(request["items"] as JsonArray ?? new JsonArray());
            case "tag.create":
                return store.CreateTag(request["name"]?.GetValue<string>() ?? "");
            case "tag.rename":
                return store.RenameTag(
                    request["id"]?.GetValue<string>() ?? "",
                    request["name"]?.GetValue<string>() ?? "");
            case "tag.delete":
                return store.DeleteTag(request["id"]?.GetValue<string>() ?? "");
            case "item.open":
            {
                var id = request["id"]?.GetValue<string>() ?? "";
                var kind = request["kind"]?.GetValue<string>() ?? "image";
                OpenItemWindow(kind, id);
                return new JsonObject { ["opened"] = true };
            }
            case "app.revealLibrary":
                Process.Start(new ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = $"\"{store.RootPath}\"",
                    UseShellExecute = true
                });
                return new JsonObject { ["opened"] = true };
            case "app.openPreferences":
                OpenPreferencesWindow();
                return new JsonObject { ["opened"] = true };
            case "window.close":
                Window.GetWindow(this)?.Close();
                return new JsonObject { ["closed"] = true };
            case "window.minimize":
                if (Window.GetWindow(this) is { } minimizeWindow)
                {
                    minimizeWindow.WindowState = WindowState.Minimized;
                }
                return new JsonObject { ["minimized"] = true };
            case "window.toggleMaximize":
            {
                var window = Window.GetWindow(this);
                if (window is null)
                {
                    return new JsonObject { ["maximized"] = false };
                }
                window.WindowState = window.WindowState == WindowState.Maximized
                    ? WindowState.Normal
                    : WindowState.Maximized;
                return new JsonObject { ["maximized"] = window.WindowState == WindowState.Maximized };
            }
            case "window.dragStart":
                try
                {
                    var window = Window.GetWindow(this);
                    if (window is not null)
                    {
                        var handle = new WindowInteropHelper(window).Handle;
                        ReleaseCapture();
                        SendMessage(handle, WmNcLButtonDown, (IntPtr)HitTestCaption, IntPtr.Zero);
                    }
                }
                catch
                {
                }
                return new JsonObject { ["dragged"] = true };
            default:
                throw new InvalidOperationException($"未知操作：{action}");
        }
    }

    private void OpenItemWindow(string kind, string id)
    {
        DebugLog($"Opening window: {kind}:{id}");
        var app = Application.Current;
        var existing = app.Windows.OfType<Window>()
            .FirstOrDefault(window => window.Tag is string key && key == $"{kind}:{id}");
        if (existing is not null)
        {
            if (existing.WindowState == WindowState.Minimized)
            {
                existing.WindowState = WindowState.Normal;
            }
            existing.Activate();
            return;
        }

        var isBoard = kind == "board";
        var window = new Window
        {
            Title = isBoard ? "MegaBox — 画布" : "MegaBox — 图像",
            Width = isBoard ? 1380 : 1120,
            Height = 860,
            MinWidth = isBoard ? 980 : 760,
            MinHeight = 600,
            WindowStyle = WindowStyle.None,
            ResizeMode = ResizeMode.CanResize,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Background = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(12, 14, 18)),
            Tag = $"{kind}:{id}",
            Content = new ViewerWindowHost(isBoard ? "board" : "image", id, kind)
        };
        WindowChrome.SetWindowChrome(window, new WindowChrome
        {
            CaptionHeight = 0,
            ResizeBorderThickness = new Thickness(6),
            CornerRadius = new CornerRadius(0),
            GlassFrameThickness = new Thickness(0),
            UseAeroCaptionButtons = false
        });

        window.Show();
    }

    private static void OpenPreferencesWindow()
    {
        DebugLog("Opening preferences window");
        var app = Application.Current;
        var existing = app.Windows.OfType<Window>()
            .FirstOrDefault(window => window.Tag is string key && key == "preferences");
        if (existing is not null)
        {
            if (existing.WindowState == WindowState.Minimized)
            {
                existing.WindowState = WindowState.Normal;
            }
            existing.Activate();
            return;
        }

        var window = new Window
        {
            Title = "MegaBox — Preferences",
            Width = 980,
            Height = 700,
            MinWidth = 760,
            MinHeight = 540,
            WindowStyle = WindowStyle.None,
            ResizeMode = ResizeMode.CanResize,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Background = new System.Windows.Media.SolidColorBrush(
                System.Windows.Media.Color.FromRgb(12, 14, 18)),
            Tag = "preferences",
            Content = new ViewerWindowHost("preferences")
        };
        WindowChrome.SetWindowChrome(window, new WindowChrome
        {
            CaptionHeight = 0,
            ResizeBorderThickness = new Thickness(6),
            CornerRadius = new CornerRadius(0),
            GlassFrameThickness = new Thickness(0),
            UseAeroCaptionButtons = false
        });
        window.Show();
    }

    private static void CloseWindowsForDeletedAsset(string assetId, JsonArray? affectedBoardIds)
    {
        var boardKeys = new HashSet<string>(
            (affectedBoardIds ?? new JsonArray())
                .OfType<JsonValue>()
                .Select(value => $"board:{value.GetValue<string>()}"));
        var windows = Application.Current.Windows.OfType<Window>().ToList();
        foreach (var window in windows)
        {
            if (window.Tag is not string key)
            {
                continue;
            }

            if (key == $"image:{assetId}" || boardKeys.Contains(key))
            {
                window.Close();
            }
        }
    }

    private void Respond(JsonObject response)
    {
        _webView.CoreWebView2.PostWebMessageAsJson(response.ToJsonString());
    }

    private static void DebugLog(string message)
    {
        var path = Environment.GetEnvironmentVariable("MEGABOX_DEBUG_LOG");
        if (string.IsNullOrWhiteSpace(path))
        {
            return;
        }

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
            File.AppendAllText(path, $"{DateTime.Now:O} {message}{Environment.NewLine}");
        }
        catch
        {
        }
    }

    private static void SeedDemoIfRequested(LibraryStore store)
    {
        if (Environment.GetEnvironmentVariable("MEGABOX_SEED_DEMO") != "1" || store.GetLibrary()["assets"] is not JsonArray assets || assets.Count > 0)
        {
            return;
        }

        var paths = (Environment.GetEnvironmentVariable("MEGABOX_DEMO_IMAGES") ?? "")
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(File.Exists)
            .ToArray();
        if (paths.Length == 0)
        {
            return;
        }

        var imported = store.ImportPaths(paths);
        var items = imported["items"] as JsonArray ?? new JsonArray();
        var ids = new JsonArray();
        foreach (var item in items.OfType<JsonObject>())
        {
            if (item["id"]?.GetValue<string>() is { } id)
            {
                ids.Add(id);
            }
        }

        if (ids.Count > 0 && store.GetLibrary()["boards"] is JsonArray boards && boards.Count == 0)
        {
            store.CreateBoard("视觉参考板", ids);
        }
    }
}
