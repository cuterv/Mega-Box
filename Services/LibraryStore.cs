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
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif"
    };

    private readonly object _gate = new();
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

    public JsonObject ImportFiles(IntPtr ownerHandle, string? folderId = null)
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

        return ImportPaths(dialog.FileNames, folderId);
    }

    public JsonObject ImportPaths(IEnumerable<string> paths, string? folderId = null)
    {
        lock (_gate)
        {
            var data = Load();
            var assets = data["assets"] as JsonArray ?? new JsonArray();
            var imported = new JsonArray();

            foreach (var path in paths.Where(File.Exists))
            {
                if (!SupportedExtensions.Contains(Path.GetExtension(path)))
                {
                    continue;
                }

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
                    ["folderId"] = string.IsNullOrWhiteSpace(folderId) ? "" : folderId,
                    ["tags"] = new JsonArray(),
                    ["crop"] = CropDefaults()
                };

                assets.Add(asset);
                imported.Add(asset.DeepClone());
            }

            data["assets"] = assets;
            Save(data);
            return new JsonObject { ["items"] = imported, ["count"] = imported.Count };
        }
    }

    public JsonObject ImportData(JsonArray files, string? folderId = null)
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), "MegaBox-import-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempRoot);
        try
        {
            var paths = new List<string>();
            foreach (var file in files.OfType<JsonObject>())
            {
                var name = Path.GetFileName(file["name"]?.GetValue<string>() ?? "");
                var data = file["data"]?.GetValue<string>() ?? "";
                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(data))
                {
                    continue;
                }

                var comma = data.IndexOf(',');
                if (comma >= 0)
                {
                    data = data[(comma + 1)..];
                }

                var path = Path.Combine(tempRoot, name);
                File.WriteAllBytes(path, Convert.FromBase64String(data));
                paths.Add(path);
            }

            return ImportPaths(paths, folderId);
        }
        finally
        {
            try { Directory.Delete(tempRoot, true); } catch { }
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
            data["assets"] = assets;
            Save(data);

            var fileDeleted = false;
            if (!string.IsNullOrWhiteSpace(fileName) && Path.GetFileName(fileName) == fileName)
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
                ["createdAt"] = DateTime.UtcNow.ToString("O")
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
