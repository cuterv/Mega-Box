using System.Windows;

namespace MegaBox;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        var testView = Environment.GetEnvironmentVariable("MEGABOX_TEST_VIEW");
        if (string.IsNullOrWhiteSpace(testView) || testView == "main")
        {
            Content = new ViewerWindowHost("main");
            return;
        }

        Content = new ViewerWindowHost(
            testView,
            Environment.GetEnvironmentVariable("MEGABOX_TEST_ID"),
            testView);
    }
}
