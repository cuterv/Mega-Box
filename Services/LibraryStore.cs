using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows.Media.Imaging;
using Microsoft.Win32;

namespace MegaBox.Services;

public sealed class LibraryStore
{
    private static long _lastSortOrder;

    private sealed class UploadSession
    {
        public required string Id { get; init; }
        public required string DirectoryPath { get; init; }
        public required string FilePath { get; init; }
        public required string FileName { get; init; }
        public required long ExpectedSize { get; init; }
        public long ReceivedSize { get; set; }
    }

    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif"
    };

    private readonly object _gate = new();
    private readonly Dictionary<string, UploadSession> _uploads = new(StringComparer.Ordinal);
    private readonly string _root;
    private readonly string _dataPath;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public LibraryStore()
    {
        var configuredRoot = Environment.GetEnvironmentVariable("MEGABOX_DATA_ROOT");
        if (!string.IsNullOrWhiteSpace(configuredRoot))
        {
            _root = configuredRoot;
        }
        else
        {
            var applicationDirectory = Path.GetDirectoryName(Environment.ProcessPath)
                ?? AppContext.BaseDirectory;
            _root = Path.Combine(applicationDirectory, "MegaBoxLibrary");
        }
        _dataPath = Path.Combine(_root, "library.json");

        Directory.CreateDirectory(_root);
        Directory.CreateDirectory(AssetsPath);
        Directory.CreateDirectory(ThumbnailsPath);
        EnsureSeedData();
    }

    public string RootPath => _root;
    public string AssetsPath => Path.Combine(_root, "assets");
    public string PdfCachePath => Path.Combine(_root, "pdf-cache");
    public string ThumbnailsPath => Path.Combine(_root, "thumbnails");

    public JsonObject GetLibrary()
    {
        lock (_gate)
        {
            var data = Load();
            return new JsonObject
            {
                ["assets"] = data["assets"]?.DeepClone() ?? new JsonArray(),
                ["boards"] = data["boards"]?.DeepClone() ?? new JsonArray(),
                ["folders"] = data["folders"]?.DeepClone() ?? new JsonArray(),
                ["tags"] = data["tags"]?.DeepClone() ?? new JsonArray(),
                ["collections"] = data["collections"]?.DeepClone() ?? new JsonArray()
            };
        }
    }

    public JsonObject GetAsset(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var asset = FindById(data["assets"] as JsonArray, id)
                ?? throw new InvalidOperationException("找不到该素材。");
            return asset.DeepClone().AsObject();
        }
    }

    public JsonObject GetBoard(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var board = FindById(data["boards"] as JsonArray, id)
                ?? throw new InvalidOperationException("找不到该画布。");
            return board.DeepClone().AsObject();
        }
    }

    public async Task<JsonObject> ImportFilesAsync(
        IntPtr ownerHandle,
        string? folderId = null,
        Action<PdfImportProgress>? progress = null)
    {
        var dialog = new OpenFileDialog
        {
            Title = "导入素材",
            Multiselect = true,
            Filter = "图片素材|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.tif;*.tiff;*.avif|所有文件|*.*"
        };

        if (dialog.ShowDialog() != true)
        {
            return new JsonObject { ["canceled"] = true };
        }

        var files = dialog.FileNames.ToArray();
        return await Task.Run(() => ImportPaths(files, folderId, progress));
    }

    public async Task<JsonObject> ImportPdfAsync(
        IntPtr ownerHandle,
        string? parentFolderId,
        string? pageRange,
        int dpi,
        Action<PdfImportProgress>? progress = null)
    {
        var dialog = new OpenFileDialog
        {
            Title = "Import PDF / 导入 PDF / PDFをインポート / PDF 가져오기",
            Multiselect = false,
            Filter = "PDF|*.pdf|所有文件|*.*"
        };

        if (dialog.ShowDialog() != true)
        {
            return new JsonObject { ["canceled"] = true };
        }

        progress?.Invoke(new PdfImportProgress("loading", 0, 0, null));
        return await ImportPdfPathAsync(
            dialog.FileName,
            parentFolderId,
            pageRange,
            dpi,
            progress);
    }

    public async Task<JsonObject> ImportPdfPathAsync(
        string pdfPath,
        string? parentFolderId,
        string? pageRange,
        int dpi,
        Action<PdfImportProgress>? progress = null)
    {
        var pdfName = Path.GetFileNameWithoutExtension(pdfPath);
        var resolvedDpi = Math.Clamp(dpi, 72, 600);
        var tempRoot = Path.Combine(Path.GetTempPath(), "MegaBox-pdf-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);
        try
        {
            progress?.Invoke(new PdfImportProgress("loading", 0, 0, null));
            var rendered = await PdfConverter.RenderAsync(
                pdfPath,
                tempRoot,
                pageRange ?? "",
                resolvedDpi,
                progress);
            var folder = FindOrCreatePdfFolder(pdfName, parentFolderId);
            progress?.Invoke(new PdfImportProgress(
                "importing",
                rendered.SelectedPageCount,
                rendered.SelectedPageCount,
                null));
            var imported = ImportPaths(rendered.PagePaths, folder["id"]?.GetValue<string>());
            progress?.Invoke(new PdfImportProgress(
                "done",
                rendered.SelectedPageCount,
                rendered.SelectedPageCount,
                null));
            return new JsonObject
            {
                ["canceled"] = false,
                ["folder"] = folder,
                ["items"] = imported["items"]?.DeepClone() ?? new JsonArray(),
                ["count"] = imported["count"]?.GetValue<int>() ?? 0,
                ["pageCount"] = rendered.SelectedPageCount,
                ["documentPageCount"] = rendered.TotalPageCount
            };
        }
        finally
        {
            try { Directory.Delete(tempRoot, true); } catch { }
        }
    }

    private JsonObject FindOrCreatePdfFolder(string name, string? parentFolderId)
    {
        var resolvedParentId = parentFolderId ?? "";
        var folders = GetLibrary()["folders"] as JsonArray ?? new JsonArray();
        var existing = folders.OfType<JsonObject>().FirstOrDefault(folder =>
            string.Equals(folder["name"]?.GetValue<string>(), name, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(folder["parentId"]?.GetValue<string>() ?? "", resolvedParentId, StringComparison.Ordinal));
        return existing is null
            ? CreateFolder(name, resolvedParentId)
            : existing.DeepClone().AsObject();
    }

    public JsonObject ImportPaths(
        IEnumerable<string> paths,
        string? folderId = null,
        Action<PdfImportProgress>? progress = null)
    {
        var supportedPaths = paths
            .Where(File.Exists)
            .Where(path => SupportedExtensions.Contains(Path.GetExtension(path)))
            .ToArray();
        progress?.Invoke(new PdfImportProgress("images", 0, supportedPaths.Length, null));
        lock (_gate)
        {
            var data = Load();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var imported = new JsonArray();
            for (var index = 0; index < supportedPaths.Length; index++)
            {
                var path = supportedPaths[index];

                var hash = ComputeHash(path);
                var existing = assets.OfType<JsonObject>()
                    .FirstOrDefault(asset => asset["hash"]?.GetValue<string>() == hash);
                if (existing is not null)
                {
                    if (!string.IsNullOrWhiteSpace(folderId))
                    {
                        existing["folderId"] = folderId;
                    }
                    imported.Add(existing.DeepClone());
                    progress?.Invoke(new PdfImportProgress(
                        "images",
                        index + 1,
                        supportedPaths.Length,
                        null));
                    continue;
                }

                var extension = Path.GetExtension(path).ToLowerInvariant();
                var storedName = hash[..Math.Min(24, hash.Length)] + extension;
                var targetPath = Path.Combine(AssetsPath, storedName);
                if (!File.Exists(targetPath))
                {
                    File.Copy(path, targetPath);
                }

                var info = new FileInfo(targetPath);
                var dimensions = ReadImageDimensions(targetPath);
                var asset = new JsonObject
                {
                    ["id"] = Guid.NewGuid().ToString("N"),
                    ["kind"] = "image",
                    ["name"] = Path.GetFileNameWithoutExtension(path),
                    ["fileName"] = storedName,
                    ["hash"] = hash,
                    ["extension"] = extension,
                    ["size"] = info.Length,
                    ["width"] = dimensions.Width,
                    ["height"] = dimensions.Height,
                    ["createdAt"] = DateTime.UtcNow.ToString("O"),
                    ["sortOrder"] = NextSortOrder(),
                    ["folderId"] = string.IsNullOrWhiteSpace(folderId) ? "" : folderId,
                    ["tags"] = new JsonArray(),
                    ["crop"] = CropDefaults()
                };

                assets.Add(asset);
                imported.Add(asset.DeepClone());
                progress?.Invoke(new PdfImportProgress(
                    "images",
                    index + 1,
                    supportedPaths.Length,
                    null));
            }

            data["assets"] = assets;
            Save(data);
            progress?.Invoke(new PdfImportProgress(
                "done",
                supportedPaths.Length,
                supportedPaths.Length,
                null));
            return new JsonObject { ["items"] = imported, ["count"] = imported.Count };
        }
    }

    public JsonObject BeginUpload(string name, long expectedSize)
    {
        var fileName = Path.GetFileName(name ?? "");
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new InvalidOperationException("待导入文件缺少名称。");
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!SupportedExtensions.Contains(extension) &&
            !string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("不支持该文件格式。");
        }
        if (expectedSize < 0 || expectedSize > 8L * 1024 * 1024 * 1024)
        {
            throw new InvalidOperationException("文件大小超出支持范围。");
        }

        var id = Guid.NewGuid().ToString("N");
        var directoryPath = Path.Combine(Path.GetTempPath(), "MegaBox-upload-" + id);
        Directory.CreateDirectory(directoryPath);
        var session = new UploadSession
        {
            Id = id,
            DirectoryPath = directoryPath,
            FilePath = Path.Combine(directoryPath, fileName),
            FileName = fileName,
            ExpectedSize = expectedSize
        };
        lock (_gate)
        {
            _uploads[id] = session;
        }
        return new JsonObject { ["uploadId"] = id };
    }

    public JsonObject AppendUpload(string uploadId, string data)
    {
        if (string.IsNullOrWhiteSpace(uploadId) || string.IsNullOrWhiteSpace(data))
        {
            throw new InvalidOperationException("上传分块为空。");
        }
        if (data.Length > 1024 * 1024)
        {
            throw new InvalidOperationException("上传分块过大。");
        }

        var bytes = Convert.FromBase64String(data);
        lock (_gate)
        {
            if (!_uploads.TryGetValue(uploadId, out var session))
            {
                throw new InvalidOperationException("上传会话不存在或已经结束。");
            }
            if (session.ReceivedSize + bytes.Length > session.ExpectedSize)
            {
                throw new InvalidOperationException("上传数据超过了声明大小。");
            }
            using var stream = new FileStream(
                session.FilePath,
                FileMode.Append,
                FileAccess.Write,
                FileShare.Read,
                128 * 1024,
                FileOptions.SequentialScan);
            stream.Write(bytes);
            session.ReceivedSize += bytes.Length;
            return new JsonObject
            {
                ["received"] = session.ReceivedSize,
                ["total"] = session.ExpectedSize
            };
        }
    }

    public async Task<JsonObject> FinishUpload(
        string uploadId,
        string? folderId,
        Action<PdfImportProgress>? progress = null)
    {
        UploadSession? session;
        lock (_gate)
        {
            _uploads.TryGetValue(uploadId, out session);
            if (session is not null)
            {
                _uploads.Remove(uploadId);
            }
        }
        if (session is null)
        {
            throw new InvalidOperationException("上传会话不存在或已经结束。");
        }
        if (session.ReceivedSize != session.ExpectedSize)
        {
            DeleteTemporaryUpload(session);
            throw new InvalidOperationException("文件上传不完整，请重新拖入。");
        }

        try
        {
            if (string.Equals(Path.GetExtension(session.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
            {
                return await ImportPdfPathAsync(session.FilePath, folderId, "", 75, progress);
            }
            return ImportPaths(new[] { session.FilePath }, folderId);
        }
        finally
        {
            DeleteTemporaryUpload(session);
        }
    }

    public JsonObject CancelUpload(string uploadId)
    {
        UploadSession? session;
        lock (_gate)
        {
            _uploads.TryGetValue(uploadId, out session);
            if (session is not null)
            {
                _uploads.Remove(uploadId);
            }
        }
        if (session is not null)
        {
            DeleteTemporaryUpload(session);
        }
        return new JsonObject { ["canceled"] = true };
    }

    private static void DeleteTemporaryUpload(UploadSession session)
    {
        try
        {
            if (Directory.Exists(session.DirectoryPath))
            {
                Directory.Delete(session.DirectoryPath, true);
            }
        }
        catch
        {
        }
    }

    public JsonObject CreateBoard(string name, JsonArray? assetIds = null, string? folderId = null)
    {
        lock (_gate)
        {
            var data = Load();
            var boards = data["boards"] as JsonArray ?? new JsonArray();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var boardId = Guid.NewGuid().ToString("N");
            var items = new JsonArray();
            var resolvedName = string.IsNullOrWhiteSpace(name)
                ? $"未命名画布 {boards.Count + 1}"
                : name.Trim();

            if (assetIds is not null)
            {
                var index = 0;
                var cursorX = 180;
                var cursorY = 150;
                var rowHeight = 0;
                foreach (var node in assetIds)
                {
                    var assetId = node?.GetValue<string>();
                    var asset = FindById(assets, assetId);
                    if (asset is null)
                    {
                        continue;
                    }

                    var dimensions = GetAssetDimensions(asset);
                    var itemWidth = dimensions.Width > 0 ? dimensions.Width : 800;
                    var itemHeight = dimensions.Height > 0 ? dimensions.Height : 600;
                    if (index > 0 && cursorX + itemWidth > 3200)
                    {
                        cursorX = 180;
                        cursorY += rowHeight + 100;
                        rowHeight = 0;
                    }

                    items.Add(new JsonObject
                    {
                        ["id"] = Guid.NewGuid().ToString("N"),
                        ["kind"] = "image",
                        ["assetId"] = assetId,
                        ["x"] = cursorX,
                        ["y"] = cursorY,
                        ["width"] = itemWidth,
                        ["height"] = itemHeight,
                        ["rotation"] = 0,
                        ["opacity"] = 1,
                        ["z"] = index + 1,
                        ["crop"] = CropDefaults()
                    });
                    cursorX += itemWidth + 100;
                    rowHeight = Math.Max(rowHeight, itemHeight);
                    index++;
                }
            }

            var board = new JsonObject
            {
                ["id"] = boardId,
                ["kind"] = "board",
                ["name"] = resolvedName,
                ["folderId"] = string.IsNullOrWhiteSpace(folderId) ? "" : folderId,
                ["createdAt"] = DateTime.UtcNow.ToString("O"),
                ["updatedAt"] = DateTime.UtcNow.ToString("O"),
                ["sortOrder"] = NextSortOrder(),
                ["items"] = items,
                ["viewport"] = new JsonObject { ["x"] = 0, ["y"] = 0, ["zoom"] = 1 },
                ["background"] = "#11141a"
            };
            boards.Add(board);
            data["boards"] = boards;
            Save(data);
            return board.DeepClone().AsObject();
        }
    }

    public JsonObject SaveBoard(JsonObject incoming)
    {
        lock (_gate)
        {
            var data = Load();
            var boards = data["boards"] as JsonArray ?? new JsonArray();
            var id = incoming["id"]?.GetValue<string>()
                ?? throw new InvalidOperationException("画布缺少 id。");
            var index = IndexOfId(boards, id);
            if (index < 0)
            {
                throw new InvalidOperationException("画布不存在。");
            }

            incoming["updatedAt"] = DateTime.UtcNow.ToString("O");
            incoming["kind"] = "board";
            boards[index] = incoming.DeepClone();
            data["boards"] = boards;
            Save(data);
            return new JsonObject { ["saved"] = true, ["updatedAt"] = incoming["updatedAt"]?.GetValue<string>() };
        }
    }

    public JsonObject DeleteBoard(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var boards = data["boards"] as JsonArray ?? new JsonArray();
            var index = IndexOfId(boards, id);
            if (index >= 0)
            {
                boards.RemoveAt(index);
                data["boards"] = boards;
                Save(data);
            }
            return new JsonObject { ["deleted"] = true };
        }
    }

    public JsonObject DeleteAsset(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var asset = FindById(assets, id)
                ?? throw new InvalidOperationException("素材不存在。");
            var fileName = asset["fileName"]?.GetValue<string>() ?? "";
            var previewPath = asset["previewPath"]?.GetValue<string>() ?? "";
            var sourcePdfFile = asset["sourcePdfFile"]?.GetValue<string>() ?? "";
            var sourcePdfHash = asset["sourcePdfHash"]?.GetValue<string>() ?? "";
            var affectedBoards = new JsonArray();

            if (data["boards"] is JsonArray boards)
            {
                foreach (var board in boards.OfType<JsonObject>())
                {
                    if (board["items"] is not JsonArray items)
                    {
                        continue;
                    }

                    var retained = new JsonArray();
                    foreach (var item in items)
                    {
                        var isLinkedImage =
                            item?["kind"]?.GetValue<string>() == "image" &&
                            item["assetId"]?.GetValue<string>() == id;
                        if (!isLinkedImage)
                        {
                            retained.Add(item?.DeepClone());
                        }
                    }

                    if (retained.Count != items.Count)
                    {
                        board["items"] = retained;
                        board["updatedAt"] = DateTime.UtcNow.ToString("O");
                        affectedBoards.Add(board["id"]?.GetValue<string>() ?? "");
                    }
                }
            }

            assets.Remove(asset);
            var sourcePdfStillUsed = !string.IsNullOrWhiteSpace(sourcePdfFile) &&
                assets.OfType<JsonObject>().Any(candidate =>
                    string.Equals(
                        candidate["sourcePdfFile"]?.GetValue<string>(),
                        sourcePdfFile,
                        StringComparison.OrdinalIgnoreCase));
            data["assets"] = assets;
            Save(data);

            var fileDeleted = false;
            if (!string.IsNullOrWhiteSpace(sourcePdfFile))
            {
                if (!sourcePdfStillUsed)
                {
                    var sourcePath = Path.GetFullPath(Path.Combine(AssetsPath, sourcePdfFile));
                    var assetsRoot = Path.GetFullPath(AssetsPath) + Path.DirectorySeparatorChar;
                    if (sourcePath.StartsWith(assetsRoot, StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            if (File.Exists(sourcePath))
                            {
                                File.Delete(sourcePath);
                                fileDeleted = true;
                            }
                        }
                        catch
                        {
                        }
                    }
                }

                DeletePdfPageCacheAssets(previewPath, sourcePdfHash, !sourcePdfStillUsed);
            }
            else if (!string.IsNullOrWhiteSpace(fileName) && Path.GetFileName(fileName) == fileName)
            {
                var assetPath = Path.GetFullPath(Path.Combine(AssetsPath, fileName));
                var assetsRoot = Path.GetFullPath(AssetsPath) + Path.DirectorySeparatorChar;
                if (assetPath.StartsWith(assetsRoot, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        if (File.Exists(assetPath))
                        {
                            File.Delete(assetPath);
                            fileDeleted = true;
                        }
                    }
                    catch
                    {
                    }
                }
            }

            return new JsonObject
            {
                ["deleted"] = true,
                ["fileDeleted"] = fileDeleted,
                ["affectedBoardIds"] = affectedBoards
            };
        }
    }

    private void DeletePdfPageCacheAssets(string previewPath, string sourcePdfHash, bool deleteWholePdfCache)
    {
        var cacheRoot = Path.GetFullPath(PdfCachePath) + Path.DirectorySeparatorChar;
        if (deleteWholePdfCache &&
            !string.IsNullOrWhiteSpace(sourcePdfHash) &&
            Path.GetFileName(sourcePdfHash) == sourcePdfHash)
        {
            var cacheKey = sourcePdfHash[..Math.Min(24, sourcePdfHash.Length)];
            var directoryPath = Path.GetFullPath(Path.Combine(PdfCachePath, cacheKey));
            if (directoryPath.StartsWith(cacheRoot, StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    if (Directory.Exists(directoryPath))
                    {
                        Directory.Delete(directoryPath, true);
                    }
                }
                catch
                {
                }
            }
            return;
        }

        if (string.IsNullOrWhiteSpace(previewPath))
        {
            return;
        }

        var filePath = Path.GetFullPath(Path.Combine(_root, previewPath.Replace('/', Path.DirectorySeparatorChar)));
        if (filePath.StartsWith(cacheRoot, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }
            catch
            {
            }
        }
    }

    public JsonObject UpdateAsset(string id, JsonObject updates)
    {
        lock (_gate)
        {
            var data = Load();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var asset = FindById(assets, id)
                ?? throw new InvalidOperationException("素材不存在。");

            if (updates["name"] is JsonNode nameNode)
            {
                asset["name"] = nameNode.ToString();
            }
            if (updates["crop"] is JsonNode cropNode)
            {
                asset["crop"] = cropNode.DeepClone();
            }
            if (updates["tags"] is JsonNode tagsNode)
            {
                asset["tags"] = tagsNode.DeepClone();
            }
            if (updates["annotations"] is JsonNode annotationsNode)
            {
                asset["annotations"] = annotationsNode.DeepClone();
            }

            data["assets"] = assets;
            Save(data);
            return asset.DeepClone().AsObject();
        }
    }

    public JsonObject CreateFolder(string name, string? parentId = null)
    {
        lock (_gate)
        {
            var resolvedName = (name ?? "").Trim();
            if (string.IsNullOrWhiteSpace(resolvedName))
            {
                throw new InvalidOperationException("文件夹名称不能为空。");
            }

            var data = Load();
            var folders = data["folders"] as JsonArray ?? new JsonArray();
            var resolvedParentId = parentId ?? "";
            if (!string.IsNullOrWhiteSpace(resolvedParentId) &&
                FindById(folders, resolvedParentId) is null)
            {
                throw new InvalidOperationException("上级文件夹不存在。");
            }
            if (folders.OfType<JsonObject>().Any(folder =>
                    string.Equals(folder["parentId"]?.GetValue<string>() ?? "", resolvedParentId, StringComparison.Ordinal) &&
                    string.Equals(folder["name"]?.GetValue<string>(), resolvedName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("同一层级下已经有同名文件夹。");
            }

            var palette = new[] { "#8b7cff", "#59d8a7", "#f3ad5c", "#f16f78", "#68b7ff" };
            var folder = new JsonObject
            {
                ["id"] = Guid.NewGuid().ToString("N"),
                ["name"] = resolvedName,
                ["parentId"] = resolvedParentId,
                ["color"] = palette[folders.Count % palette.Length],
                ["createdAt"] = DateTime.UtcNow.ToString("O"),
                ["sortOrder"] = NextSortOrder()
            };
            folders.Add(folder);
            data["folders"] = folders;
            Save(data);
            return folder.DeepClone().AsObject();
        }
    }

    public JsonObject RenameFolder(string id, string name)
    {
        lock (_gate)
        {
            var resolvedName = (name ?? "").Trim();
            if (string.IsNullOrWhiteSpace(resolvedName))
            {
                throw new InvalidOperationException("文件夹名称不能为空。");
            }

            var data = Load();
            var folders = data["folders"] as JsonArray ?? new JsonArray();
            var folder = FindById(folders, id)
                ?? throw new InvalidOperationException("文件夹不存在。");
            var parentId = folder["parentId"]?.GetValue<string>() ?? "";
            if (folders.OfType<JsonObject>().Any(candidate =>
                    candidate["id"]?.GetValue<string>() != id &&
                    string.Equals(candidate["parentId"]?.GetValue<string>() ?? "", parentId, StringComparison.Ordinal) &&
                    string.Equals(candidate["name"]?.GetValue<string>(), resolvedName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("同一层级下已经有同名文件夹。");
            }

            folder["name"] = resolvedName;
            data["folders"] = folders;
            Save(data);
            return folder.DeepClone().AsObject();
        }
    }

    public JsonObject DeleteFolder(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var folders = data["folders"] as JsonArray ?? new JsonArray();
            var index = IndexOfId(folders, id);
            if (index < 0)
            {
                throw new InvalidOperationException("文件夹不存在。");
            }

            var folder = folders[index]?.AsObject()
                ?? throw new InvalidOperationException("文件夹数据无效。");
            var parentId = folder["parentId"]?.GetValue<string>() ?? "";
            folders.RemoveAt(index);
            foreach (var childFolder in folders.OfType<JsonObject>())
            {
                if (childFolder["parentId"]?.GetValue<string>() == id)
                {
                    childFolder["parentId"] = parentId;
                }
            }
            data["folders"] = folders;
            foreach (var key in new[] { "assets", "boards" })
            {
                if (data[key] is not JsonArray entries)
                {
                    continue;
                }
                foreach (var entry in entries.OfType<JsonObject>())
                {
                    if (entry["folderId"]?.GetValue<string>() == id)
                    {
                        entry["folderId"] = parentId;
                    }
                }
            }
            Save(data);
            return new JsonObject { ["deleted"] = true };
        }
    }

    public JsonObject MoveFolder(string id, string? parentId)
    {
        lock (_gate)
        {
            var data = Load();
            var folders = data["folders"] as JsonArray ?? new JsonArray();
            var folder = FindById(folders, id)
                ?? throw new InvalidOperationException("文件夹不存在。");
            var targetParentId = parentId ?? "";
            if (targetParentId == id)
            {
                throw new InvalidOperationException("不能把文件夹移动到自身。");
            }
            if (!string.IsNullOrWhiteSpace(targetParentId) &&
                FindById(folders, targetParentId) is null)
            {
                throw new InvalidOperationException("目标文件夹不存在。");
            }

            var currentParent = targetParentId;
            var guard = 0;
            while (!string.IsNullOrWhiteSpace(currentParent) && guard++ < folders.Count + 1)
            {
                if (currentParent == id)
                {
                    throw new InvalidOperationException("不能把文件夹移动到自己的子文件夹中。");
                }
                currentParent = FindById(folders, currentParent)?["parentId"]?.GetValue<string>() ?? "";
            }

            var name = folder["name"]?.GetValue<string>() ?? "";
            if (folders.OfType<JsonObject>().Any(candidate =>
                    candidate["id"]?.GetValue<string>() != id &&
                    string.Equals(candidate["parentId"]?.GetValue<string>() ?? "", targetParentId, StringComparison.Ordinal) &&
                    string.Equals(candidate["name"]?.GetValue<string>(), name, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("目标位置已经有同名文件夹。");
            }

            folder["parentId"] = targetParentId;
            data["folders"] = folders;
            Save(data);
            return folder.DeepClone().AsObject();
        }
    }

    public JsonObject AssignItemsToFolder(JsonArray items, string? folderId)
    {
        lock (_gate)
        {
            var data = Load();
            var targetFolderId = folderId ?? "";
            if (!string.IsNullOrWhiteSpace(targetFolderId) &&
                FindById(data["folders"] as JsonArray, targetFolderId) is null)
            {
                throw new InvalidOperationException("目标文件夹不存在。");
            }

            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var boards = data["boards"] as JsonArray ?? new JsonArray();
            var updated = 0;
            foreach (var item in items.OfType<JsonObject>())
            {
                var id = item["id"]?.GetValue<string>();
                var kind = item["kind"]?.GetValue<string>();
                var target = kind == "board" ? FindById(boards, id) : FindById(assets, id);
                if (target is null)
                {
                    continue;
                }

                target["folderId"] = targetFolderId;
                updated++;
            }

            data["assets"] = assets;
            data["boards"] = boards;
            Save(data);
            return new JsonObject { ["updated"] = updated };
        }
    }

    public JsonObject ReorderFiles(JsonArray items)
    {
        lock (_gate)
        {
            var data = Load();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var boards = data["boards"] as JsonArray ?? new JsonArray();
            var sortOrder = NextSortOrder();
            var updated = 0;
            foreach (var item in items.OfType<JsonObject>())
            {
                var id = item["id"]?.GetValue<string>();
                var kind = item["kind"]?.GetValue<string>();
                if (kind is not ("image" or "board"))
                {
                    continue;
                }

                var target = kind == "board" ? FindById(boards, id) : FindById(assets, id);
                if (target is null)
                {
                    continue;
                }
                target["sortOrder"] = sortOrder++;
                updated++;
            }

            data["assets"] = assets;
            data["boards"] = boards;
            Save(data);
            return new JsonObject { ["updated"] = updated };
        }
    }

    public JsonObject ReorderFolders(JsonArray items)
    {
        lock (_gate)
        {
            var data = Load();
            var folders = data["folders"] as JsonArray ?? new JsonArray();
            var sortOrder = NextSortOrder();
            var updated = 0;
            foreach (var item in items.OfType<JsonObject>())
            {
                var folder = FindById(folders, item["id"]?.GetValue<string>());
                if (folder is null)
                {
                    continue;
                }
                folder["sortOrder"] = sortOrder++;
                updated++;
            }
            data["folders"] = folders;
            Save(data);
            return new JsonObject { ["updated"] = updated };
        }
    }

    public JsonObject CreateTag(string name)
    {
        lock (_gate)
        {
            var resolvedName = (name ?? "").Trim().TrimStart('#').Trim();
            if (string.IsNullOrWhiteSpace(resolvedName))
            {
                throw new InvalidOperationException("标签名称不能为空。");
            }

            var data = Load();
            var tags = data["tags"] as JsonArray ?? new JsonArray();
            if (tags.OfType<JsonObject>().Any(tag =>
                    string.Equals(tag["name"]?.GetValue<string>(), resolvedName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("已经有同名标签。");
            }

            var palette = new[] { "#8b7cff", "#59d8a7", "#f3ad5c", "#68b7ff", "#f16f78", "#d38cff" };
            var tag = new JsonObject
            {
                ["id"] = Guid.NewGuid().ToString("N"),
                ["name"] = resolvedName,
                ["color"] = palette[tags.Count % palette.Length],
                ["createdAt"] = DateTime.UtcNow.ToString("O")
            };
            tags.Add(tag);
            data["tags"] = tags;
            Save(data);
            return tag.DeepClone().AsObject();
        }
    }

    public JsonObject RenameTag(string id, string name)
    {
        lock (_gate)
        {
            var resolvedName = (name ?? "").Trim().TrimStart('#').Trim();
            if (string.IsNullOrWhiteSpace(resolvedName))
            {
                throw new InvalidOperationException("标签名称不能为空。");
            }

            var data = Load();
            var tags = data["tags"] as JsonArray ?? new JsonArray();
            var tag = FindById(tags, id)
                ?? throw new InvalidOperationException("标签不存在。");
            if (tags.OfType<JsonObject>().Any(candidate =>
                    candidate["id"]?.GetValue<string>() != id &&
                    string.Equals(candidate["name"]?.GetValue<string>(), resolvedName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("已经有同名标签。");
            }

            var oldName = tag["name"]?.GetValue<string>() ?? "";
            tag["name"] = resolvedName;
            data["tags"] = tags;
            ReplaceAssetTag(data, oldName, resolvedName);
            Save(data);
            return tag.DeepClone().AsObject();
        }
    }

    public JsonObject DeleteTag(string id)
    {
        lock (_gate)
        {
            var data = Load();
            var tags = data["tags"] as JsonArray ?? new JsonArray();
            var tag = FindById(tags, id)
                ?? throw new InvalidOperationException("标签不存在。");
            tags.Remove(tag);
            data["tags"] = tags;
            ReplaceAssetTag(data, tag["name"]?.GetValue<string>() ?? "", "");
            Save(data);
            return new JsonObject { ["deleted"] = true };
        }
    }

    private void EnsureSeedData()
    {
        lock (_gate)
        {
            if (File.Exists(_dataPath))
            {
                return;
            }

            Save(new JsonObject
            {
                ["version"] = 1,
                ["assets"] = new JsonArray(),
                ["boards"] = new JsonArray(),
                ["folders"] = new JsonArray(),
                ["tags"] = new JsonArray(),
                ["collections"] = new JsonArray
                {
                    new JsonObject { ["id"] = "all", ["name"] = "全部素材", ["color"] = "#7c8cff" },
                    new JsonObject { ["id"] = "images", ["name"] = "图片", ["color"] = "#5dd6a4" },
                    new JsonObject { ["id"] = "boards", ["name"] = "画布", ["color"] = "#f1ae59" }
                }
            });
        }
    }

    private JsonObject Load()
    {
        try
        {
            var json = File.ReadAllText(_dataPath, Encoding.UTF8);
            var data = JsonNode.Parse(json)?.AsObject() ?? EmptyLibrary();
            data["folders"] ??= new JsonArray();
            data["tags"] ??= new JsonArray();
            data["assets"] ??= new JsonArray();
            data["boards"] ??= new JsonArray();
            return data;
        }
        catch
        {
            return EmptyLibrary();
        }
    }

    private void Save(JsonObject data)
    {
        Directory.CreateDirectory(_root);
        var temp = _dataPath + ".tmp";
        File.WriteAllText(temp, data.ToJsonString(_jsonOptions), new UTF8Encoding(false));
        File.Move(temp, _dataPath, true);
    }

    private static JsonObject EmptyLibrary() => new()
    {
        ["version"] = 1,
        ["assets"] = new JsonArray(),
        ["boards"] = new JsonArray(),
        ["folders"] = new JsonArray(),
        ["tags"] = new JsonArray(),
        ["collections"] = new JsonArray()
    };

    private static JsonObject? FindById(JsonArray? array, string? id)
    {
        if (array is null || string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        return array.OfType<JsonObject>()
            .FirstOrDefault(item => item["id"]?.GetValue<string>() == id);
    }

    private static int IndexOfId(JsonArray array, string id)
    {
        for (var i = 0; i < array.Count; i++)
        {
            if (array[i]?["id"]?.GetValue<string>() == id)
            {
                return i;
            }
        }
        return -1;
    }

    private static string ComputeHash(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private static long NextSortOrder()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000L;
        while (true)
        {
            var previous = Interlocked.Read(ref _lastSortOrder);
            var next = Math.Max(timestamp, previous + 1);
            if (Interlocked.CompareExchange(ref _lastSortOrder, next, previous) == previous)
            {
                return next;
            }
        }
    }

    private (int Width, int Height) GetAssetDimensions(JsonObject asset)
    {
        var width = asset["width"]?.GetValue<int>() ?? 0;
        var height = asset["height"]?.GetValue<int>() ?? 0;
        if (width > 0 && height > 0)
        {
            return (width, height);
        }

        var fileName = asset["fileName"]?.GetValue<string>() ?? "";
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
        {
            return (0, 0);
        }

        return ReadImageDimensions(Path.Combine(AssetsPath, fileName));
    }

    private static (int Width, int Height) ReadImageDimensions(string path)
    {
        try
        {
            using var stream = File.OpenRead(path);
            var decoder = BitmapDecoder.Create(
                stream,
                BitmapCreateOptions.PreservePixelFormat,
                BitmapCacheOption.OnLoad);
            var frame = decoder.Frames[0];
            return (frame.PixelWidth, frame.PixelHeight);
        }
        catch
        {
            return (0, 0);
        }
    }

    private static JsonObject CropDefaults() => new()
    {
        ["left"] = 0,
        ["top"] = 0,
        ["right"] = 0,
        ["bottom"] = 0
    };

    private static void ReplaceAssetTag(JsonObject data, string oldName, string newName)
    {
        if (data["assets"] is not JsonArray assets)
        {
            return;
        }

        foreach (var asset in assets.OfType<JsonObject>())
        {
            if (asset["tags"] is not JsonArray assetTags)
            {
                continue;
            }

            var replacement = new JsonArray();
            foreach (var node in assetTags)
            {
                var tagName = node?.GetValue<string>() ?? "";
                if (!string.Equals(tagName, oldName, StringComparison.Ordinal))
                {
                    replacement.Add(tagName);
                }
                else if (!string.IsNullOrWhiteSpace(newName) &&
                         !replacement.Any(existing =>
                             string.Equals(existing?.GetValue<string>(), newName, StringComparison.Ordinal)))
                {
                    replacement.Add(newName);
                }
            }
            asset["tags"] = replacement;
        }
    }
}
