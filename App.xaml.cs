using System.Windows;
using System.IO;

namespace MegaBox;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        var logPath = Environment.GetEnvironmentVariable("MEGABOX_DEBUG_LOG");
        if (!string.IsNullOrWhiteSpace(logPath))
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(logPath) ?? ".");
                File.AppendAllText(logPath, $"{DateTime.Now:O} App starting{Environment.NewLine}");
            }
            catch
            {
            }
        }
        base.OnStartup(e);
    }
}
