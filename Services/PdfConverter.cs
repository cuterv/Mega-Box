using System.Globalization;
using System.IO;
using Windows.Data.Pdf;
using Windows.Storage;

namespace MegaBox.Services;

public sealed record PdfRenderedPage(uint PageNumber, string Path);
public sealed record PdfImportProgress(string Stage, int Current, int Total, int? PageNumber);

public sealed record PdfRenderResult(
    IReadOnlyList<PdfRenderedPage> Pages,
    int TotalPageCount)
{
    public int SelectedPageCount => Pages.Count;
    public IReadOnlyList<string> PagePaths => Pages.Select(page => page.Path).ToList();
}

public static partial class PdfConverter
{
    private const double WindowsDipDpi = 96d;
    private const double MaxRenderSide = 8192d;
    private const double MaxRenderPixels = 32_000_000d;

    public static async Task<PdfRenderResult> RenderAsync(
        string pdfPath,
        string outputDirectory,
        string pageRange,
        int dpi,
        Action<PdfImportProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var storageFile = await StorageFile.GetFileFromPathAsync(pdfPath);
        var document = await PdfDocument.LoadFromFileAsync(storageFile);
        var selectedPages = ParsePageRange(pageRange, document.PageCount);
        if (selectedPages.Count == 0)
        {
            throw new InvalidOperationException("PDF 页码范围没有匹配任何页面。");
        }
        progress?.Invoke(new PdfImportProgress("selected", 0, selectedPages.Count, null));

        var safeBaseName = SanitizeFileName(Path.GetFileNameWithoutExtension(pdfPath));
        var renderedPages = new List<PdfRenderedPage>(selectedPages.Count);
        foreach (var pageNumber in selectedPages)
        {
            cancellationToken.ThrowIfCancellationRequested();
            using var page = document.GetPage(pageNumber - 1);
            var box = page.Dimensions.ArtBox;
            var requestedWidth = Math.Max(1d, Math.Round(box.Width * dpi / WindowsDipDpi));
            var requestedHeight = Math.Max(1d, Math.Round(box.Height * dpi / WindowsDipDpi));
            var sizeLimitScale = Math.Min(1d, MaxRenderSide / Math.Max(requestedWidth, requestedHeight));
            var pixelLimitScale = Math.Min(
                1d,
                Math.Sqrt(MaxRenderPixels / (requestedWidth * requestedHeight)));
            var renderScale = Math.Min(sizeLimitScale, pixelLimitScale);
            var destinationWidth = Math.Max(1, (int)Math.Round(requestedWidth * renderScale));
            var destinationHeight = Math.Max(1, (int)Math.Round(requestedHeight * renderScale));
            var renderOptions = new PdfPageRenderOptions
            {
                DestinationWidth = (uint)destinationWidth,
                DestinationHeight = (uint)destinationHeight
            };

            var outputPath = Path.Combine(
                outputDirectory,
                $"{safeBaseName}_{pageNumber.ToString("D3", CultureInfo.InvariantCulture)}.png");
            await File.WriteAllBytesAsync(outputPath, Array.Empty<byte>(), cancellationToken);
            var outputFile = await StorageFile.GetFileFromPathAsync(outputPath);
            using var stream = await outputFile.OpenAsync(FileAccessMode.ReadWrite);
            stream.Size = 0;
            await page.RenderToStreamAsync(stream, renderOptions);
            renderedPages.Add(new PdfRenderedPage(pageNumber, outputPath));
            progress?.Invoke(new PdfImportProgress(
                "render",
                renderedPages.Count,
                selectedPages.Count,
                checked((int)pageNumber)));
        }

        return new PdfRenderResult(renderedPages, checked((int)document.PageCount));
    }

    private static List<uint> ParsePageRange(string? text, uint pageCount)
    {
        var value = (text ?? "").Trim();
        if (string.IsNullOrWhiteSpace(value) ||
            value.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return Enumerable.Range(1, checked((int)pageCount)).Select(page => (uint)page).ToList();
        }

        var pages = new SortedSet<uint>();
        foreach (var rawPart in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (rawPart.Contains('-'))
            {
                var bounds = rawPart.Split('-', 2, StringSplitOptions.TrimEntries);
                if (bounds.Length != 2 ||
                    !uint.TryParse(bounds[0], out var start) ||
                    !uint.TryParse(bounds[1], out var end))
                {
                    throw new InvalidOperationException($"无法识别页码范围：{rawPart}");
                }

                if (start > end)
                {
                    (start, end) = (end, start);
                }
                for (var page = start; page <= end && page <= pageCount; page++)
                {
                    if (page > 0)
                    {
                        pages.Add(page);
                    }
                }
            }
            else if (uint.TryParse(rawPart, out var page) && page > 0 && page <= pageCount)
            {
                pages.Add(page);
            }
            else
            {
                throw new InvalidOperationException($"无法识别页码：{rawPart}");
            }
        }
        return pages.ToList();
    }

    private static string SanitizeFileName(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var sanitized = new string(value.Select(character => invalid.Contains(character) ? '_' : character).ToArray());
        return string.IsNullOrWhiteSpace(sanitized) ? "PDF" : sanitized.Trim();
    }
}
