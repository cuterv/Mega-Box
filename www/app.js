(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const view = params.get("view") || "library";
  const app = document.getElementById("app");
  const toastStack = document.getElementById("toast-stack");
  const pendingRequests = new Map();
  let requestSequence = 0;
  let internalDragActive = false;
  let libraryDragKind = "";
  let libraryDraggedFolderId = "";
  let libraryDraggedItemKeys = [];
  let libraryMarqueeActive = false;
  let libraryClickSuppressedUntil = 0;

  const uiText = {
    "zh-CN": {
      preferences: "偏好设置",
      settingsEyebrow: "设置",
      preferencesSubtitle: "管理 MegaBox 的显示与使用方式。",
      general: "通用",
      appearance: "外观",
      language: "语言",
      languageTitle: "界面语言",
      languageDescription: "选择 MegaBox 使用的显示语言。设置会保存在本机，并应用到素材库、图片查看器和画板。",
      languageSaved: "语言更改会自动保存，切换到其他窗口后会同步更新。",
      currentLanguage: "当前语言",
      simplifiedChinese: "简体中文",
      english: "English",
      assetSpace: "素材空间",
      allAssets: "全部素材",
      recent: "最近使用",
      images: "图片",
      boards: "画布",
      folders: "文件夹",
      tags: "标签",
      noTags: "暂无标签",
      uncategorized: "未分类",
      openLibraryFolder: "打开素材目录",
      localLibrary: "本地素材库",
      offline: "离线",
      filesLocal: "文件保存在本机",
      searchPlaceholder: "搜索名称、标签或类型…",
      importAssets: "导入素材",
      dropToImport: "释放以导入素材",
      dropFormats: "支持图片与 PDF",
      importPdf: "导入 PDF",
      pdfImportTitle: "将 PDF 导入为图片",
      pdfPageRange: "页码范围",
      pdfPageRangeHint: "留空表示全部页面，例如：1-5, 8, 10-12",
      pdfResolution: "渲染分辨率",
      pdfImportButton: "开始转换",
      pdfImporting: "正在转换 PDF，请稍候…",
      pdfImported: "已从 PDF 导入 {count} 页到“{folder}”",
      pdfPage: "PDF 页码",
      pdfProgressTitle: "正在导入 PDF",
      importProgressTitle: "正在导入素材",
      importPreparing: "正在准备导入…",
      imageImporting: "正在导入第 {current} / {total} 个素材…",
      importFinishing: "正在写入素材库…",
      pdfPreparing: "正在读取 PDF 信息…",
      pdfReading: "正在读取文件 {percent}%",
      pdfRendering: "正在转换第 {current} / {total} 页…",
      pdfSaving: "正在保存页面…",
      selectAll: "全选",
      newBoard: "新建画布",
      itemsOnDevice: "个项目，保存在此设备",
      dragImages: "把图片拖进来，或从本机导入素材",
      folderDropHint: "把素材拖到左侧文件夹，或在此导入新素材",
      tagEmptyHint: "这个标签下还没有图片，可以到图片属性中添加",
      selectedItems: "已选择",
      open: "打开",
      saveAsBoard: "存为画布",
      delete: "删除",
      libraryEmpty: "素材库还是空的",
      libraryEmptyText: "导入第一批参考图，或者直接创建一个画布。素材会保存在本机，不需要网络。",
      folderEmpty: "这个文件夹还是空的",
      folderEmptyText: "从其他列表把素材拖到左侧文件夹，或直接导入到当前文件夹。",
      tagEmpty: "这个标签下还没有图片",
      tagEmptyText: "打开图片窗口，在标签区域勾选这个标签即可加入。",
      searchEmpty: "没有找到匹配素材",
      searchEmptyText: "换一个关键词，或清除当前筛选条件。",
      clearSearch: "清除搜索",
      confirm: "确定",
      cancel: "取消",
      zoomIn: "放大",
      zoomOut: "缩小",
      fitWindow: "适合窗口",
      singleImage: "单图",
      properties: "属性",
      saved: "已保存",
      saving: "正在保存…",
      imageViewer: "图像查看器",
      imageMissing: "素材不存在",
      material: "素材",
      file: "文件",
      width: "宽度",
      height: "高度",
      format: "格式",
      size: "大小",
      importedAt: "导入时间",
      crop: "裁剪",
      reset: "重置",
      leftPercent: "左 %",
      topPercent: "上 %",
      rightPercent: "右 %",
      bottomPercent: "下 %",
      cropHint: "裁剪不会修改原图，只保存显示范围。",
      add: "添加",
      collapse: "收起",
      removeTag: "移除标签",
      newTag: "新建标签",
      imageTagCreateMessage: "创建后会立即添加到当前图片。",
      createAndAdd: "创建并添加",
      noTagsImageHint: "还没有标签，点击“添加”选择或新建。",
      noAvailableTags: "还没有可用标签。",
      annotationText: "文字标注",
      deselect: "取消选择",
      content: "内容",
      backgroundColor: "背景颜色",
      textColor: "文字颜色",
      notePositionHint: "也可以直接在图像上拖动标注来修改位置。",
      deleteAnnotation: "删除标注",
      noAnnotationsImageHint: "还没有标注。点击“添加”在图像上放置文字。",
      annotations: "标注",
      imageObject: "图片对象",
      materialMissing: "素材已丢失",
      fileSize: "文件大小",
      positionAndSize: "位置与尺寸",
      rotation: "旋转",
      opacity: "不透明度",
      canvasCrop: "画布内裁剪",
      duplicate: "复制",
      bringToFront: "移到最前",
      moveToBottom: "移到最底",
      deleteObject: "删除对象",
      textAnnotation: "文字标注",
      fontSize: "字号",
      backgroundOpacity: "背景不透明度",
      textOpacity: "文字不透明度",
      arrowAnnotation: "箭头标注",
      color: "颜色",
      length: "长度",
      lineWidth: "线宽",
      colorOpacity: "颜色不透明度",
      portal: "传送门",
      jumpModule: "跳转模块",
      portalName: "名称",
      current: "当前",
      target: "目标",
      windowMinimize: "最小化",
      windowMaximize: "最大化",
      windowRestore: "还原",
      windowClose: "关闭",
      showAssetsPanel: "展开素材栏",
      hideAssetsPanel: "收起素材栏",
      showPropertiesPanel: "展开属性栏",
      hidePropertiesPanel: "收起属性栏",
      pairedPortalMissing: "配对已丢失",
      samePairPortal: "同组传送门",
      jumpToOtherPortal: "跳转到另一个传送门",
      portalDoubleClickHint: "双击任意传送门也可以直接跳转到它的配对传送门。",
      portalDoubleClickShort: "双击跳转到同组传送门",
      frameBoard: "画框底板",
      frameSize: "画框尺寸",
      frameWidth: "宽度",
      border: "边框",
      borderWidth: "边框宽度",
      borderColor: "边框颜色",
      borderOpacity: "边框不透明度",
      background: "背景",
      proportionalScale: "等比缩放",
      boardWorkspace: "画布工作区",
      boardAssets: "画布素材",
      searchImagesFolders: "搜索图片或文件夹…",
      importNewAssets: "导入新素材",
      fitAllContent: "适合全部内容",
      saveNow: "立即保存",
      hideAllTools: "完全隐藏工具栏",
      showAllTools: "显示全部工具栏",
      toolSelect: "选择工具",
      toolText: "添加文字标注",
      toolArrow: "添加箭头",
      toolPortal: "添加一对传送门",
      toolFrame: "添加画框底板",
      objects: "个对象",
      canvasHelp: "滚轮缩放 · 空格拖动画布",
      canvas: "画布",
      canvasInfo: "画布信息",
      boardName: "名称",
      objectCount: "对象",
      updatedAt: "更新时间",
      boardBackground: "画布背景",
      shortcuts: "快捷键",
      addText: "添加文字",
      panCanvas: "拖动平移",
      zoomCanvas: "缩放画布",
      duplicateObject: "复制对象",
      emptyBoardTitle: "把参考图拖到这里",
      emptyBoardHint: "从左侧素材栏拖动、双击，或直接拖入新文件",
      emptyFolder: "空文件夹",
      importedAssets: "已导入 {count} 个素材",
      deleteBoardTitle: "删除画布“{name}”？",
      deleteBoardMessage: "画布会被永久删除，但画布中引用的图片素材仍会保留在素材库中。",
      deleteBoardConfirm: "删除画布",
      boardDeleted: "已删除画布“{name}”",
      deleteImageTitle: "删除图片“{name}”？",
      deleteImageMessage: "原图会从素材库中永久删除，并同时从所有画布中移除。这个操作不能撤销。",
      deleteImageConfirm: "删除图片",
      imageDeleted: "图片已删除",
      imageDeletedFileBusy: "图片记录已删除，但原文件暂时被占用",
      deleteSelectionTitle: "删除选中的 {count} 个项目？",
      deleteSelectionMessage: "将永久删除{summary}。图片会同时从所有画布中移除，操作不能撤销。",
      confirmDelete: "确认删除",
      deletedItems: "已删除 {count} 个项目",
      newFolder: "新建文件夹",
      defaultFolderName: "新建文件夹",
      defaultTagName: "新标签",
      newSubfolderTitle: "在“{name}”中新建子文件夹",
      newFolderMessage: "用文件夹整理同类型素材，之后可以直接把卡片拖进去。",
      newSubfolderMessage: "子文件夹可以继续创建下级，也可以把素材直接拖进去。",
      folderName: "文件夹名称",
      create: "创建",
      folderCreated: "已创建文件夹“{name}”",
      folderMoved: "子文件夹已移动",
      folderMovedRoot: "文件夹已移到根目录",
      tagCreateMessage: "标签可以跨文件夹筛选图片，也可以直接在图片属性中勾选。",
      tagName: "标签名称",
      tagCreated: "已创建标签“# {name}”",
      renameFolder: "重命名文件夹",
      save: "保存",
      folderRenamed: "文件夹已重命名",
      deleteFolderTitle: "删除“{name}”？",
      deleteFolderMessage: "内部素材和子文件夹不会被删除，它们会移动到上一级；如果已经位于根目录，则移到“未分类”。",
      deleteFolderConfirm: "删除文件夹",
      folderDeleted: "文件夹已删除，素材已移至未分类",
      movedItems: "已将 {count} 个项目移到“{target}”",
      invalidDrop: "无法读取拖入的素材",
      portalPairCreated: "已创建一对“{name}”，双击任意传送门可跳转",
      frameAdded: "已添加画框底板，可在属性栏调整颜色和透明度",
      portalPairMissing: "配对传送门已丢失"
      ,blankBoard: "空白画布"
      ,referenceBoard: "参考画布"
      ,boardMissing: "画布不存在"
      ,noMatchingImages: "没有找到匹配图片。"
      ,noImagesImport: "还没有图片，先导入素材。"
      ,resizeBoth: "等比或自由缩放"
      ,resizeHeight: "只修改高度"
      ,resizeWidth: "只修改宽度"
      ,rotateHandle: "拖动旋转"
      ,scaleHint: "左右拖动调整，按住 Shift 加速"
      ,proportionalScaleHint: "左右拖动按当前比例缩放"
      ,originalScaleHint: "左右拖动按原图比例缩放"
      ,unableOpenWindow: "无法打开此窗口"
      ,retry: "重试"
      ,expand: "展开"
      ,openFolder: "打开文件夹"
      ,openNewWindow: "在新窗口打开"
      ,deleteImage: "删除图片"
      ,deleteFolder: "删除文件夹"
      ,newSubfolder: "新建子文件夹"
      ,rename: "重命名"
      ,newFolderTooltip: "新建文件夹"
      ,newTagTooltip: "新建标签"
      ,gridView: "标准视图"
      ,compactView: "紧凑视图"
      ,imageUnit: "张图片"
      ,subfolderUnit: "个子文件夹"
      ,itemUnit: "个项目"
      ,storedOnDevice: "保存在此设备"
      ,listSeparator: "和"
      ,actions: "操作"
      ,drag: "拖动"
      ,wheel: "滚轮"
      ,emptyAnnotation: "空标注"
      ,defaultTextAnnotation: "双击右侧修改标注"
      ,defaultBoardNote: "在这里输入标注"
      ,untitledAsset: "未命名素材"
      ,tagCreatedAndAdded: "已创建并添加标签“# {name}”"
    },
    "en-US": {
      preferences: "Preferences",
      settingsEyebrow: "Settings",
      preferencesSubtitle: "Manage how MegaBox looks and works.",
      general: "General",
      appearance: "Appearance",
      language: "Language",
      languageTitle: "Display language",
      languageDescription: "Choose the language used by MegaBox. This setting is stored locally and applies across the library, image viewer, and boards.",
      languageSaved: "Language changes are saved automatically and applied when other windows regain focus.",
      currentLanguage: "Current language",
      simplifiedChinese: "简体中文",
      english: "English",
      assetSpace: "Asset Space",
      allAssets: "All Assets",
      recent: "Recent",
      images: "Images",
      boards: "Boards",
      folders: "Folders",
      tags: "Tags",
      noTags: "No tags",
      uncategorized: "Uncategorized",
      openLibraryFolder: "Open Library Folder",
      localLibrary: "Local Library",
      offline: "Offline",
      filesLocal: "Files stored on this device",
      searchPlaceholder: "Search names, tags, or types…",
      importAssets: "Import Assets",
      dropToImport: "Drop to import",
      dropFormats: "Images and PDF are supported",
      importPdf: "Import PDF",
      pdfImportTitle: "Import PDF as Images",
      pdfPageRange: "Page range",
      pdfPageRangeHint: "Leave blank for all pages, for example: 1-5, 8, 10-12",
      pdfResolution: "Render resolution",
      pdfImportButton: "Start Conversion",
      pdfImporting: "Converting PDF, please wait…",
      pdfImported: "Imported {count} pages from PDF into “{folder}”",
      pdfPage: "PDF page",
      pdfProgressTitle: "Importing PDF",
      importProgressTitle: "Importing Assets",
      importPreparing: "Preparing import…",
      imageImporting: "Importing item {current} of {total}…",
      importFinishing: "Writing to the library…",
      pdfPreparing: "Reading PDF information…",
      pdfReading: "Reading file {percent}%",
      pdfRendering: "Rendering page {current} of {total}…",
      pdfSaving: "Saving pages…",
      selectAll: "Select All",
      newBoard: "New Board",
      itemsOnDevice: "items stored on this device",
      dragImages: "Drag images here or import from this device",
      folderDropHint: "Drag items into a folder or import new assets here",
      tagEmptyHint: "No images have this tag yet. Add it from an image's properties.",
      selectedItems: "Selected",
      open: "Open",
      saveAsBoard: "Save as Board",
      delete: "Delete",
      libraryEmpty: "Your library is empty",
      libraryEmptyText: "Import your first references or create a board. Everything stays on this device and works offline.",
      folderEmpty: "This folder is empty",
      folderEmptyText: "Drag items from another view or import new assets into this folder.",
      tagEmpty: "No images with this tag",
      tagEmptyText: "Open an image and select this tag from its properties.",
      searchEmpty: "No matching assets",
      searchEmptyText: "Try another keyword or clear the current filters.",
      clearSearch: "Clear Search",
      confirm: "Confirm",
      cancel: "Cancel",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      fitWindow: "Fit to Window",
      singleImage: "Image",
      properties: "Properties",
      saved: "Saved",
      saving: "Saving…",
      imageViewer: "Image Viewer",
      imageMissing: "Asset not found",
      material: "Asset",
      file: "File",
      width: "Width",
      height: "Height",
      format: "Format",
      size: "Size",
      importedAt: "Imported",
      crop: "Crop",
      reset: "Reset",
      leftPercent: "Left %",
      topPercent: "Top %",
      rightPercent: "Right %",
      bottomPercent: "Bottom %",
      cropHint: "Cropping is non-destructive and only changes the visible area.",
      add: "Add",
      collapse: "Collapse",
      removeTag: "Remove tag",
      newTag: "New Tag",
      imageTagCreateMessage: "The new tag will be added to this image.",
      createAndAdd: "Create & Add",
      noTagsImageHint: "No tags yet. Click Add to choose or create one.",
      noAvailableTags: "No available tags.",
      annotationText: "Text Annotation",
      deselect: "Deselect",
      content: "Content",
      backgroundColor: "Background",
      textColor: "Text Color",
      notePositionHint: "You can also drag the annotation directly on the image.",
      deleteAnnotation: "Delete Annotation",
      noAnnotationsImageHint: "No annotations yet. Click Add to place text on the image.",
      annotations: "Annotations",
      imageObject: "Image Object",
      materialMissing: "Asset missing",
      fileSize: "File Size",
      positionAndSize: "Position & Size",
      rotation: "Rotation",
      opacity: "Opacity",
      canvasCrop: "Canvas Crop",
      duplicate: "Duplicate",
      bringToFront: "Bring to Front",
      moveToBottom: "Send to Back",
      deleteObject: "Delete Object",
      textAnnotation: "Text Annotation",
      fontSize: "Font Size",
      backgroundOpacity: "Background Opacity",
      textOpacity: "Text Opacity",
      arrowAnnotation: "Arrow Annotation",
      color: "Color",
      length: "Length",
      lineWidth: "Line Width",
      colorOpacity: "Color Opacity",
      portal: "Portal",
      jumpModule: "Jump Module",
      portalName: "Name",
      current: "Current",
      target: "Target",
      windowMinimize: "Minimize",
      windowMaximize: "Maximize",
      windowRestore: "Restore",
      windowClose: "Close",
      showAssetsPanel: "Show Assets Panel",
      hideAssetsPanel: "Hide Assets Panel",
      showPropertiesPanel: "Show Properties Panel",
      hidePropertiesPanel: "Hide Properties Panel",
      pairedPortalMissing: "Pair missing",
      samePairPortal: "Paired portal",
      jumpToOtherPortal: "Jump to Paired Portal",
      portalDoubleClickHint: "You can also double-click either portal to jump to its pair.",
      portalDoubleClickShort: "Double-click to jump",
      frameBoard: "Frame Board",
      frameSize: "Frame Size",
      frameWidth: "Width",
      border: "Border",
      borderWidth: "Border Width",
      borderColor: "Border Color",
      borderOpacity: "Border Opacity",
      background: "Background",
      proportionalScale: "Proportional Scale",
      boardWorkspace: "Board Workspace",
      boardAssets: "Board Assets",
      searchImagesFolders: "Search images or folders…",
      importNewAssets: "Import New Assets",
      fitAllContent: "Fit All Content",
      saveNow: "Save Now",
      hideAllTools: "Hide All Toolbars",
      showAllTools: "Show All Toolbars",
      toolSelect: "Select Tool",
      toolText: "Add Text Annotation",
      toolArrow: "Add Arrow",
      toolPortal: "Add Portal Pair",
      toolFrame: "Add Frame Background",
      objects: "objects",
      canvasHelp: "Wheel to zoom · Space + drag to pan",
      canvas: "Canvas",
      canvasInfo: "Canvas Information",
      boardName: "Name",
      objectCount: "Objects",
      updatedAt: "Updated",
      boardBackground: "Canvas Background",
      shortcuts: "Shortcuts",
      addText: "Add Text",
      panCanvas: "Pan Canvas",
      zoomCanvas: "Zoom Canvas",
      duplicateObject: "Duplicate Object",
      emptyBoardTitle: "Drop reference images here",
      emptyBoardHint: "Drag from the asset panel, double-click, or drop new files",
      emptyFolder: "Empty folder",
      importedAssets: "{count} assets imported",
      deleteBoardTitle: "Delete board “{name}”?",
      deleteBoardMessage: "The board will be permanently deleted. Images used by the board will remain in the library.",
      deleteBoardConfirm: "Delete Board",
      boardDeleted: "Deleted board “{name}”",
      deleteImageTitle: "Delete image “{name}”?",
      deleteImageMessage: "The original file will be permanently deleted and removed from every board. This cannot be undone.",
      deleteImageConfirm: "Delete Image",
      imageDeleted: "Image deleted",
      imageDeletedFileBusy: "The image record was deleted, but the original file is currently in use.",
      deleteSelectionTitle: "Delete {count} selected items?",
      deleteSelectionMessage: "Permanently delete {summary}. Images will also be removed from all boards. This cannot be undone.",
      confirmDelete: "Delete",
      deletedItems: "Deleted {count} items",
      newFolder: "New Folder",
      defaultFolderName: "New Folder",
      defaultTagName: "New Tag",
      newSubfolderTitle: "Create a subfolder in “{name}”",
      newFolderMessage: "Organize related assets in folders, then drag cards into them directly.",
      newSubfolderMessage: "Subfolders can contain more folders and assets.",
      folderName: "Folder name",
      create: "Create",
      folderCreated: "Created folder “{name}”",
      folderMoved: "Subfolder moved",
      folderMovedRoot: "Folder moved to the root",
      tagCreateMessage: "Tags filter images across folders and can be selected directly from image properties.",
      tagName: "Tag name",
      tagCreated: "Created tag # {name}",
      renameFolder: "Rename Folder",
      save: "Save",
      folderRenamed: "Folder renamed",
      deleteFolderTitle: "Delete “{name}”?",
      deleteFolderMessage: "Assets and subfolders will be preserved and moved up one level. Items in a root folder move to Uncategorized.",
      deleteFolderConfirm: "Delete Folder",
      folderDeleted: "Folder deleted; its contents were preserved",
      movedItems: "Moved {count} items to “{target}”",
      invalidDrop: "Unable to read the dropped items",
      portalPairCreated: "Created portal pair “{name}”. Double-click either portal to jump.",
      frameAdded: "Frame background added. Adjust its colors and opacity in Properties.",
      portalPairMissing: "The paired portal is missing"
      ,blankBoard: "Blank board"
      ,referenceBoard: "Reference Board"
      ,boardMissing: "Board not found"
      ,noMatchingImages: "No matching images."
      ,noImagesImport: "No images yet. Import assets first."
      ,resizeBoth: "Free or proportional resize"
      ,resizeHeight: "Modify height only"
      ,resizeWidth: "Modify width only"
      ,rotateHandle: "Drag to rotate"
      ,scaleHint: "Drag left or right; hold Shift to accelerate"
      ,proportionalScaleHint: "Drag left or right to scale proportionally"
      ,originalScaleHint: "Drag left or right to scale from original size"
      ,unableOpenWindow: "Unable to open this window"
      ,retry: "Retry"
      ,expand: "Expand"
      ,openFolder: "Open Folder"
      ,openNewWindow: "Open in New Window"
      ,deleteImage: "Delete Image"
      ,deleteFolder: "Delete Folder"
      ,newSubfolder: "New Subfolder"
      ,rename: "Rename"
      ,newFolderTooltip: "New Folder"
      ,newTagTooltip: "New Tag"
      ,gridView: "Standard View"
      ,compactView: "Compact View"
      ,imageUnit: "images"
      ,subfolderUnit: "subfolders"
      ,itemUnit: "items"
      ,storedOnDevice: "stored on this device"
      ,listSeparator: "and"
      ,actions: "Actions"
      ,drag: "Drag"
      ,wheel: "Wheel"
      ,emptyAnnotation: "Empty annotation"
      ,defaultTextAnnotation: "Edit this annotation from the panel"
      ,defaultBoardNote: "Type your annotation here"
      ,untitledAsset: "Untitled Asset"
      ,tagCreatedAndAdded: "Created and added tag #{name}"
    }
  };

  const jaText = {
    preferences: "環境設定",
    settingsEyebrow: "設定",
    preferencesSubtitle: "MegaBox の外観と動作を管理します。",
    general: "一般",
    appearance: "外観",
    language: "言語",
    languageTitle: "表示言語",
    languageDescription: "MegaBox の表示言語を選択します。設定はこの端末に保存され、ライブラリ、画像ビューア、ボードに適用されます。",
    languageSaved: "言語の変更は自動保存され、他のウィンドウがアクティブになると反映されます。",
    currentLanguage: "現在の言語",
    simplifiedChinese: "簡体字中国語",
    english: "English",
    assetSpace: "アセットスペース",
    allAssets: "すべてのアセット",
    recent: "最近",
    images: "画像",
    boards: "ボード",
    folders: "フォルダー",
    tags: "タグ",
    noTags: "タグなし",
    uncategorized: "未分類",
    openLibraryFolder: "ライブラリフォルダーを開く",
    localLibrary: "ローカルライブラリ",
    offline: "オフライン",
    filesLocal: "ファイルはこの端末に保存されます",
    searchPlaceholder: "名前、タグ、種類を検索…",
    importAssets: "アセットをインポート",
    dropToImport: "ドロップしてインポート",
    dropFormats: "画像と PDF に対応",
    importPdf: "PDFをインポート",
    pdfImportTitle: "PDFを画像としてインポート",
    pdfPageRange: "ページ範囲",
    pdfPageRangeHint: "空欄の場合は全ページ。例：1-5, 8, 10-12",
    pdfResolution: "レンダリング解像度",
    pdfImportButton: "変換を開始",
    pdfImporting: "PDFを変換中です。しばらくお待ちください…",
    pdfImported: "PDFから {count} ページを「{folder}」へインポートしました",
    pdfPage: "PDF ページ",
    pdfProgressTitle: "PDFをインポート中",
    importProgressTitle: "アセットをインポート中",
    importPreparing: "インポートを準備しています…",
    imageImporting: "{current} / {total} 個のアセットをインポート中…",
    importFinishing: "ライブラリへ保存しています…",
    pdfPreparing: "PDF情報を読み込んでいます…",
    pdfReading: "ファイルを読み込み中 {percent}%",
    pdfRendering: "{current} / {total} ページを変換中…",
    pdfSaving: "ページを保存しています…",
    selectAll: "すべて選択",
    newBoard: "新規ボード",
    itemsOnDevice: "個のアイテムをこの端末に保存",
    dragImages: "画像をここにドラッグするか、この端末からインポートしてください",
    folderDropHint: "アイテムをフォルダーへドラッグするか、ここでアセットをインポートしてください",
    tagEmptyHint: "このタグが付いた画像はまだありません。画像のプロパティから追加できます。",
    selectedItems: "選択中",
    open: "開く",
    saveAsBoard: "ボードとして保存",
    delete: "削除",
    libraryEmpty: "ライブラリは空です",
    libraryEmptyText: "最初の参考画像をインポートするか、ボードを作成してください。データはこの端末に保存されます。",
    folderEmpty: "このフォルダーは空です",
    folderEmptyText: "他の表示からアイテムをドラッグするか、このフォルダーへインポートしてください。",
    tagEmpty: "このタグの画像はありません",
    tagEmptyText: "画像を開き、プロパティでこのタグを選択してください。",
    searchEmpty: "一致するアセットがありません",
    searchEmptyText: "別のキーワードを試すか、現在のフィルターを解除してください。",
    clearSearch: "検索をクリア",
    confirm: "確認",
    cancel: "キャンセル",
    zoomIn: "拡大",
    zoomOut: "縮小",
    fitWindow: "ウィンドウに合わせる",
    singleImage: "画像",
    properties: "プロパティ",
    saved: "保存済み",
    saving: "保存中…",
    imageViewer: "画像ビューア",
    imageMissing: "アセットが見つかりません",
    material: "アセット",
    file: "ファイル",
    width: "幅",
    height: "高さ",
    format: "形式",
    size: "サイズ",
    importedAt: "インポート日時",
    crop: "トリミング",
    reset: "リセット",
    leftPercent: "左 %",
    topPercent: "上 %",
    rightPercent: "右 %",
    bottomPercent: "下 %",
    cropHint: "トリミングは元画像を変更せず、表示範囲のみを保存します。",
    add: "追加",
    collapse: "閉じる",
    removeTag: "タグを削除",
    newTag: "新しいタグ",
    imageTagCreateMessage: "新しいタグはこの画像にすぐ追加されます。",
    createAndAdd: "作成して追加",
    noTagsImageHint: "タグはまだありません。「追加」から選択または作成してください。",
    noAvailableTags: "利用できるタグがありません。",
    annotationText: "テキスト注釈",
    deselect: "選択解除",
    content: "内容",
    backgroundColor: "背景色",
    textColor: "文字色",
    notePositionHint: "画像上で注釈を直接ドラッグして位置を変更することもできます。",
    deleteAnnotation: "注釈を削除",
    noAnnotationsImageHint: "注釈はまだありません。「追加」から画像上にテキストを配置してください。",
    annotations: "注釈",
    imageObject: "画像オブジェクト",
    materialMissing: "アセットが見つかりません",
    fileSize: "ファイルサイズ",
    positionAndSize: "位置とサイズ",
    rotation: "回転",
    opacity: "不透明度",
    canvasCrop: "キャンバス内トリミング",
    duplicate: "複製",
    bringToFront: "最前面へ移動",
    moveToBottom: "最背面へ移動",
    deleteObject: "オブジェクトを削除",
    textAnnotation: "テキスト注釈",
    fontSize: "フォントサイズ",
    backgroundOpacity: "背景の不透明度",
    textOpacity: "文字の不透明度",
    arrowAnnotation: "矢印注釈",
    color: "色",
    length: "長さ",
    lineWidth: "線幅",
    colorOpacity: "色の不透明度",
    portal: "ポータル",
    jumpModule: "ジャンプモジュール",
    portalName: "名前",
    current: "現在",
    target: "移動先",
    windowMinimize: "最小化",
    windowMaximize: "最大化",
    windowRestore: "元に戻す",
    windowClose: "閉じる",
    showAssetsPanel: "アセットパネルを表示",
    hideAssetsPanel: "アセットパネルを隠す",
    showPropertiesPanel: "プロパティパネルを表示",
    hidePropertiesPanel: "プロパティパネルを隠す",
    pairedPortalMissing: "ペアが見つかりません",
    samePairPortal: "ペアのポータル",
    jumpToOtherPortal: "ペアのポータルへ移動",
    portalDoubleClickHint: "どちらかのポータルをダブルクリックすると、ペアへ移動できます。",
    portalDoubleClickShort: "ダブルクリックでジャンプ",
    frameBoard: "フレーム",
    frameSize: "フレームサイズ",
    frameWidth: "幅",
    border: "枠線",
    borderWidth: "枠線の幅",
    borderColor: "枠線の色",
    borderOpacity: "枠線の不透明度",
    background: "背景",
    proportionalScale: "均等スケール",
    boardWorkspace: "ボードワークスペース",
    boardAssets: "ボードアセット",
    searchImagesFolders: "画像またはフォルダーを検索…",
    importNewAssets: "新しいアセットをインポート",
    fitAllContent: "すべてを表示",
    saveNow: "今すぐ保存",
    hideAllTools: "すべてのツールバーを隠す",
    showAllTools: "すべてのツールバーを表示",
    toolSelect: "選択ツール",
    toolText: "テキスト注釈を追加",
    toolArrow: "矢印を追加",
    toolPortal: "ポータルのペアを追加",
    toolFrame: "フレームを作成",
    objects: "個のオブジェクト",
    canvasHelp: "ホイールでズーム · Space + ドラッグで移動",
    canvas: "キャンバス",
    canvasInfo: "キャンバス情報",
    boardName: "名前",
    objectCount: "オブジェクト",
    updatedAt: "更新日時",
    boardBackground: "キャンバス背景",
    shortcuts: "ショートカット",
    addText: "テキストを追加",
    panCanvas: "キャンバスを移動",
    zoomCanvas: "キャンバスをズーム",
    duplicateObject: "オブジェクトを複製",
    emptyBoardTitle: "参考画像をここにドロップ",
    emptyBoardHint: "アセットパネルからドラッグ、ダブルクリック、またはファイルをドロップしてください",
    emptyFolder: "空のフォルダー",
    importedAssets: "{count} 個のアセットをインポートしました",
    deleteBoardTitle: "ボード「{name}」を削除しますか？",
    deleteBoardMessage: "ボードは完全に削除されます。ボードで使用している画像はライブラリに残ります。",
    deleteBoardConfirm: "ボードを削除",
    boardDeleted: "ボード「{name}」を削除しました",
    deleteImageTitle: "画像「{name}」を削除しますか？",
    deleteImageMessage: "元ファイルは完全に削除され、すべてのボードからも削除されます。この操作は元に戻せません。",
    deleteImageConfirm: "画像を削除",
    imageDeleted: "画像を削除しました",
    imageDeletedFileBusy: "画像情報は削除しましたが、元ファイルは現在使用中です。",
    deleteSelectionTitle: "選択した {count} 個のアイテムを削除しますか？",
    deleteSelectionMessage: "{summary} を完全に削除します。画像はすべてのボードからも削除されます。",
    confirmDelete: "削除",
    deletedItems: "{count} 個のアイテムを削除しました",
    newFolder: "新しいフォルダー",
    defaultFolderName: "新しいフォルダー",
    defaultTagName: "新しいタグ",
    newSubfolderTitle: "「{name}」にサブフォルダーを作成",
    newFolderMessage: "関連するアセットをフォルダーで整理し、カードを直接ドラッグできます。",
    newSubfolderMessage: "サブフォルダーにはさらにフォルダーやアセットを入れられます。",
    folderName: "フォルダー名",
    create: "作成",
    folderCreated: "フォルダー「{name}」を作成しました",
    folderMoved: "サブフォルダーを移動しました",
    folderMovedRoot: "フォルダーをルートへ移動しました",
    tagCreateMessage: "タグはフォルダーをまたいで画像を絞り込み、画像のプロパティから選択できます。",
    tagName: "タグ名",
    tagCreated: "タグ #{name} を作成しました",
    renameFolder: "フォルダー名を変更",
    save: "保存",
    folderRenamed: "フォルダー名を変更しました",
    deleteFolderTitle: "「{name}」を削除しますか？",
    deleteFolderMessage: "アセットとサブフォルダーは保持され、1 階層上へ移動します。ルート内のアイテムは未分類へ移動します。",
    deleteFolderConfirm: "フォルダーを削除",
    folderDeleted: "フォルダーを削除し、内容を保持しました",
    movedItems: "{count} 個のアイテムを「{target}」へ移動しました",
    invalidDrop: "ドロップされたアイテムを読み取れません",
    portalPairCreated: "ポータルのペア「{name}」を作成しました。どちらかをダブルクリックで移動できます。",
    frameAdded: "フレームを追加しました。プロパティで色と不透明度を調整できます。",
    portalPairMissing: "ペアのポータルが見つかりません",
    blankBoard: "空のボード",
    referenceBoard: "参考ボード",
    boardMissing: "ボードが見つかりません",
    noMatchingImages: "一致する画像がありません。",
    noImagesImport: "画像がまだありません。先にアセットをインポートしてください。",
    resizeBoth: "自由または均等にサイズ変更",
    resizeHeight: "高さのみ変更",
    resizeWidth: "幅のみ変更",
    rotateHandle: "ドラッグして回転",
    scaleHint: "左右にドラッグして調整。Shift で加速",
    proportionalScaleHint: "左右にドラッグして現在の比率で拡大縮小",
    originalScaleHint: "左右にドラッグして元画像の比率で拡大縮小",
    unableOpenWindow: "このウィンドウを開けません",
    retry: "再試行",
    expand: "展開",
    openFolder: "フォルダーを開く",
    openNewWindow: "新しいウィンドウで開く",
    deleteImage: "画像を削除",
    deleteFolder: "フォルダーを削除",
    newSubfolder: "サブフォルダーを作成",
    rename: "名前を変更",
    newFolderTooltip: "新しいフォルダー",
    newTagTooltip: "新しいタグ",
    gridView: "標準表示",
    compactView: "コンパクト表示",
    imageUnit: "枚の画像",
    subfolderUnit: "個のサブフォルダー",
    itemUnit: "個のアイテム",
    storedOnDevice: "この端末に保存",
    listSeparator: "と",
    actions: "操作",
    drag: "ドラッグ",
    wheel: "ホイール",
    emptyAnnotation: "空の注釈",
    defaultTextAnnotation: "右側のパネルから注釈を編集",
    defaultBoardNote: "ここに注釈を入力",
    untitledAsset: "名前のないアセット",
    tagCreatedAndAdded: "タグ #{name} を作成して追加しました"
  };
  uiText["ja-JP"] = { ...uiText["en-US"], ...jaText };

  const koText = {
    preferences: "환경 설정",
    settingsEyebrow: "설정",
    preferencesSubtitle: "MegaBox의 모양과 동작을 관리합니다.",
    general: "일반",
    appearance: "모양",
    language: "언어",
    languageTitle: "표시 언어",
    languageDescription: "MegaBox에서 사용할 표시 언어를 선택하세요. 설정은 이 기기에 저장되며 라이브러리, 이미지 뷰어와 보드에 적용됩니다.",
    languageSaved: "언어 변경은 자동 저장되며 다른 창이 활성화될 때 적용됩니다.",
    currentLanguage: "현재 언어",
    simplifiedChinese: "중국어(간체)",
    english: "English",
    assetSpace: "에셋 공간",
    allAssets: "모든 에셋",
    recent: "최근",
    images: "이미지",
    boards: "보드",
    folders: "폴더",
    tags: "태그",
    noTags: "태그 없음",
    uncategorized: "미분류",
    openLibraryFolder: "라이브러리 폴더 열기",
    localLibrary: "로컬 라이브러리",
    offline: "오프라인",
    filesLocal: "파일이 이 기기에 저장됩니다",
    searchPlaceholder: "이름, 태그 또는 유형 검색…",
    importAssets: "에셋 가져오기",
    dropToImport: "놓아서 가져오기",
    dropFormats: "이미지와 PDF 지원",
    importPdf: "PDF 가져오기",
    pdfImportTitle: "PDF를 이미지로 가져오기",
    pdfPageRange: "페이지 범위",
    pdfPageRangeHint: "비워 두면 모든 페이지입니다. 예: 1-5, 8, 10-12",
    pdfResolution: "렌더링 해상도",
    pdfImportButton: "변환 시작",
    pdfImporting: "PDF를 변환하는 중입니다. 잠시 기다려 주세요…",
    pdfImported: "PDF에서 {count}페이지를 “{folder}”로 가져왔습니다",
    pdfPage: "PDF 페이지",
    pdfProgressTitle: "PDF 가져오는 중",
    importProgressTitle: "에셋 가져오는 중",
    importPreparing: "가져오기를 준비하는 중…",
    imageImporting: "{current} / {total}번째 에셋 가져오는 중…",
    importFinishing: "라이브러리에 저장하는 중…",
    pdfPreparing: "PDF 정보를 읽는 중…",
    pdfReading: "파일 읽는 중 {percent}%",
    pdfRendering: "{current} / {total} 페이지 변환 중…",
    pdfSaving: "페이지 저장 중…",
    selectAll: "모두 선택",
    newBoard: "새 보드",
    itemsOnDevice: "개 항목이 이 기기에 저장됨",
    dragImages: "이미지를 여기로 끌어오거나 이 기기에서 가져오세요",
    folderDropHint: "항목을 폴더로 끌어오거나 여기로 새 에셋을 가져오세요",
    tagEmptyHint: "이 태그가 지정된 이미지가 없습니다. 이미지 속성에서 추가할 수 있습니다.",
    selectedItems: "선택됨",
    open: "열기",
    saveAsBoard: "보드로 저장",
    delete: "삭제",
    libraryEmpty: "라이브러리가 비어 있습니다",
    libraryEmptyText: "첫 참고 이미지를 가져오거나 보드를 만드세요. 모든 데이터는 이 기기에 저장됩니다.",
    folderEmpty: "이 폴더가 비어 있습니다",
    folderEmptyText: "다른 보기에서 항목을 끌어오거나 이 폴더로 에셋을 가져오세요.",
    tagEmpty: "이 태그가 지정된 이미지가 없습니다",
    tagEmptyText: "이미지를 열고 속성에서 이 태그를 선택하세요.",
    searchEmpty: "일치하는 에셋이 없습니다",
    searchEmptyText: "다른 검색어를 입력하거나 현재 필터를 해제하세요.",
    clearSearch: "검색 지우기",
    confirm: "확인",
    cancel: "취소",
    zoomIn: "확대",
    zoomOut: "축소",
    fitWindow: "창에 맞추기",
    singleImage: "이미지",
    properties: "속성",
    saved: "저장됨",
    saving: "저장 중…",
    imageViewer: "이미지 뷰어",
    imageMissing: "에셋을 찾을 수 없습니다",
    material: "에셋",
    file: "파일",
    width: "너비",
    height: "높이",
    format: "형식",
    size: "크기",
    importedAt: "가져온 날짜",
    crop: "자르기",
    reset: "초기화",
    leftPercent: "왼쪽 %",
    topPercent: "위 %",
    rightPercent: "오른쪽 %",
    bottomPercent: "아래 %",
    cropHint: "자르기는 원본을 변경하지 않고 표시 영역만 저장합니다.",
    add: "추가",
    collapse: "접기",
    removeTag: "태그 제거",
    newTag: "새 태그",
    imageTagCreateMessage: "새 태그가 이 이미지에 바로 추가됩니다.",
    createAndAdd: "만들고 추가",
    noTagsImageHint: "아직 태그가 없습니다. 추가를 눌러 선택하거나 새로 만드세요.",
    noAvailableTags: "사용 가능한 태그가 없습니다.",
    annotationText: "텍스트 주석",
    deselect: "선택 해제",
    content: "내용",
    backgroundColor: "배경색",
    textColor: "글자색",
    notePositionHint: "이미지에서 주석을 직접 끌어 위치를 변경할 수도 있습니다.",
    deleteAnnotation: "주석 삭제",
    noAnnotationsImageHint: "아직 주석이 없습니다. 추가를 눌러 이미지에 텍스트를 배치하세요.",
    annotations: "주석",
    imageObject: "이미지 객체",
    materialMissing: "에셋을 찾을 수 없습니다",
    fileSize: "파일 크기",
    positionAndSize: "위치와 크기",
    rotation: "회전",
    opacity: "불투명도",
    canvasCrop: "캔버스 내 자르기",
    duplicate: "복제",
    bringToFront: "맨 앞으로 이동",
    moveToBottom: "맨 뒤로 이동",
    deleteObject: "객체 삭제",
    textAnnotation: "텍스트 주석",
    fontSize: "글꼴 크기",
    backgroundOpacity: "배경 불투명도",
    textOpacity: "글자 불투명도",
    arrowAnnotation: "화살표 주석",
    color: "색상",
    length: "길이",
    lineWidth: "선 너비",
    colorOpacity: "색상 불투명도",
    portal: "포털",
    jumpModule: "이동 모듈",
    portalName: "이름",
    current: "현재",
    target: "대상",
    windowMinimize: "최소화",
    windowMaximize: "최대화",
    windowRestore: "복원",
    windowClose: "닫기",
    showAssetsPanel: "에셋 패널 표시",
    hideAssetsPanel: "에셋 패널 숨기기",
    showPropertiesPanel: "속성 패널 표시",
    hidePropertiesPanel: "속성 패널 숨기기",
    pairedPortalMissing: "연결된 포털이 없습니다",
    samePairPortal: "같은 쌍의 포털",
    jumpToOtherPortal: "연결된 포털로 이동",
    portalDoubleClickHint: "어느 포털이든 두 번 클릭하면 연결된 포털로 이동합니다.",
    portalDoubleClickShort: "두 번 클릭하여 이동",
    frameBoard: "프레임",
    frameSize: "프레임 크기",
    frameWidth: "너비",
    border: "테두리",
    borderWidth: "테두리 너비",
    borderColor: "테두리 색상",
    borderOpacity: "테두리 불투명도",
    background: "배경",
    proportionalScale: "비율 유지 크기",
    boardWorkspace: "보드 작업 공간",
    boardAssets: "보드 에셋",
    searchImagesFolders: "이미지 또는 폴더 검색…",
    importNewAssets: "새 에셋 가져오기",
    fitAllContent: "모든 내용에 맞추기",
    saveNow: "지금 저장",
    hideAllTools: "모든 도구 모음 숨기기",
    showAllTools: "모든 도구 모음 표시",
    toolSelect: "선택 도구",
    toolText: "텍스트 주석 추가",
    toolArrow: "화살표 추가",
    toolPortal: "포털 쌍 추가",
    toolFrame: "프레임 만들기",
    objects: "개 객체",
    canvasHelp: "휠로 확대/축소 · Space + 드래그로 이동",
    canvas: "캔버스",
    canvasInfo: "캔버스 정보",
    boardName: "이름",
    objectCount: "객체",
    updatedAt: "업데이트",
    boardBackground: "캔버스 배경",
    shortcuts: "단축키",
    addText: "텍스트 추가",
    panCanvas: "캔버스 이동",
    zoomCanvas: "캔버스 확대/축소",
    duplicateObject: "객체 복제",
    emptyBoardTitle: "참고 이미지를 여기로 놓으세요",
    emptyBoardHint: "에셋 패널에서 끌어오기, 두 번 클릭 또는 새 파일을 놓으세요",
    emptyFolder: "빈 폴더",
    importedAssets: "{count}개 에셋을 가져왔습니다",
    deleteBoardTitle: "보드 “{name}”을 삭제할까요?",
    deleteBoardMessage: "보드가 영구 삭제됩니다. 보드에서 사용한 이미지는 라이브러리에 유지됩니다.",
    deleteBoardConfirm: "보드 삭제",
    boardDeleted: "보드 “{name}”을 삭제했습니다",
    deleteImageTitle: "이미지 “{name}”을 삭제할까요?",
    deleteImageMessage: "원본 파일이 영구 삭제되고 모든 보드에서 제거됩니다. 이 작업은 되돌릴 수 없습니다.",
    deleteImageConfirm: "이미지 삭제",
    imageDeleted: "이미지를 삭제했습니다",
    imageDeletedFileBusy: "이미지 정보는 삭제했지만 원본 파일이 현재 사용 중입니다.",
    deleteSelectionTitle: "선택한 {count}개 항목을 삭제할까요?",
    deleteSelectionMessage: "{summary}을 영구 삭제합니다. 이미지는 모든 보드에서도 제거됩니다.",
    confirmDelete: "삭제",
    deletedItems: "{count}개 항목을 삭제했습니다",
    newFolder: "새 폴더",
    defaultFolderName: "새 폴더",
    defaultTagName: "새 태그",
    newSubfolderTitle: "“{name}”에 하위 폴더 만들기",
    newFolderMessage: "관련 에셋을 폴더로 정리하고 카드를 바로 끌어 넣으세요.",
    newSubfolderMessage: "하위 폴더에는 더 많은 폴더와 에셋을 넣을 수 있습니다.",
    folderName: "폴더 이름",
    create: "만들기",
    folderCreated: "폴더 “{name}”을 만들었습니다",
    folderMoved: "하위 폴더를 이동했습니다",
    folderMovedRoot: "폴더를 루트로 이동했습니다",
    tagCreateMessage: "태그는 폴더 전체에서 이미지를 필터링하며 이미지 속성에서 선택할 수 있습니다.",
    tagName: "태그 이름",
    tagCreated: "태그 #{name}을 만들었습니다",
    renameFolder: "폴더 이름 변경",
    save: "저장",
    folderRenamed: "폴더 이름을 변경했습니다",
    deleteFolderTitle: "“{name}”을 삭제할까요?",
    deleteFolderMessage: "에셋과 하위 폴더는 유지되며 한 단계 위로 이동합니다. 루트의 항목은 미분류로 이동합니다.",
    deleteFolderConfirm: "폴더 삭제",
    folderDeleted: "폴더를 삭제하고 내용을 유지했습니다",
    movedItems: "{count}개 항목을 “{target}”로 이동했습니다",
    invalidDrop: "놓은 항목을 읽을 수 없습니다",
    portalPairCreated: "포털 쌍 “{name}”을 만들었습니다. 어느 포털이든 두 번 클릭하여 이동하세요.",
    frameAdded: "프레임 배경을 추가했습니다. 속성에서 색상과 불투명도를 조정하세요.",
    portalPairMissing: "연결된 포털이 없습니다",
    blankBoard: "빈 보드",
    referenceBoard: "참고 보드",
    boardMissing: "보드를 찾을 수 없습니다",
    noMatchingImages: "일치하는 이미지가 없습니다.",
    noImagesImport: "아직 이미지가 없습니다. 먼저 에셋을 가져오세요.",
    resizeBoth: "자유 또는 비율 유지 크기 조정",
    resizeHeight: "높이만 변경",
    resizeWidth: "너비만 변경",
    rotateHandle: "끌어서 회전",
    scaleHint: "좌우로 끌어 조정하고 Shift로 가속",
    proportionalScaleHint: "좌우로 끌어 현재 비율로 확대/축소",
    originalScaleHint: "좌우로 끌어 원본 비율로 확대/축소",
    unableOpenWindow: "이 창을 열 수 없습니다",
    retry: "다시 시도",
    expand: "펼치기",
    openFolder: "폴더 열기",
    openNewWindow: "새 창에서 열기",
    deleteImage: "이미지 삭제",
    deleteFolder: "폴더 삭제",
    newSubfolder: "하위 폴더 만들기",
    rename: "이름 변경",
    newFolderTooltip: "새 폴더",
    newTagTooltip: "새 태그",
    gridView: "표준 보기",
    compactView: "간결한 보기",
    imageUnit: "개 이미지",
    subfolderUnit: "개 하위 폴더",
    itemUnit: "개 항목",
    storedOnDevice: "이 기기에 저장됨",
    listSeparator: "및",
    actions: "작업",
    drag: "드래그",
    wheel: "휠",
    emptyAnnotation: "빈 주석",
    defaultTextAnnotation: "오른쪽 패널에서 주석 편집",
    defaultBoardNote: "여기에 주석을 입력하세요",
    untitledAsset: "이름 없는 에셋",
    tagCreatedAndAdded: "태그 #{name}을 만들고 추가했습니다"
  };
  uiText["ko-KR"] = { ...uiText["en-US"], ...koText };

  const supportedLanguages = [
    { code: "zh-CN", nativeName: "简体中文", englishName: "Chinese (Simplified)" },
    { code: "en-US", nativeName: "English", englishName: "English (United States)" },
    { code: "ja-JP", nativeName: "日本語", englishName: "Japanese" },
    { code: "ko-KR", nativeName: "한국어", englishName: "Korean" }
  ];

  function getLanguage() {
    try {
      const stored = localStorage.getItem("megabox.settings.language");
      return Object.prototype.hasOwnProperty.call(uiText, stored) ? stored : "zh-CN";
    } catch {
      return "zh-CN";
    }
  }

  function t(key, values = {}) {
    let text = uiText[getLanguage()]?.[key] ?? uiText["zh-CN"][key] ?? key;
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  }

  function setLanguage(language) {
    const resolved = Object.prototype.hasOwnProperty.call(uiText, language) ? language : "zh-CN";
    localStorage.setItem("megabox.settings.language", resolved);
    document.documentElement.lang = getLanguage();
    const minimize = document.querySelector("[data-window-minimize]");
    const maximize = document.querySelector("[data-window-maximize]");
    const close = document.querySelector("[data-window-close]");
    if (minimize) minimize.title = t("windowMinimize");
    if (maximize) maximize.title = t("windowMaximize");
    if (close) close.title = t("windowClose");
    updateStaticText();
  }

  function updateStaticText() {
    const dropTitle = document.querySelector("[data-drop-title]");
    const dropFormats = document.querySelector("[data-drop-formats]");
    if (dropTitle) dropTitle.textContent = t("dropToImport");
    if (dropFormats) dropFormats.textContent = t("dropFormats");
  }

  document.documentElement.lang = getLanguage();
  updateStaticText();

  const icons = {
    library:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-5 4 4 3-3 4 4"/></svg>',
    board:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h5M7 12h3M14 8h3v6h-3z"/></svg>',
    folder:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z"/></svg>',
    tag:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m20 13-7 7L4 11V4h7z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
    pdf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M8.5 13h1.2a1.3 1.3 0 0 1 0 2.6H8.5V13zm0 2.6V19m4-6h2.8m-2.8 3h2.2m-2.2 3v-6h1.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5z"/></svg>',
    plus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    open:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>',
    edit:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3"/></svg>',
    rotate:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 11a8 8 0 1 0-2.1 7.3"/><path d="M20 5v6h-6"/></svg>',
    portal:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="12" rx="7" ry="9"/><ellipse cx="12" cy="12" rx="3.2" ry="5.5"/><path d="M5 12h14"/></svg>',
    frame:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="7" y="8" width="10" height="8" rx="1"/></svg>',
    panelLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>',
    panelRight:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',
    globe:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    grid:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    selectAll:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="12" height="12" rx="1.5"/><path d="M8 8h4M8 12h4M18 8h2v12H8v-2"/></svg>',
    compact:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="11" y="4" width="6" height="5" rx="1"/><rect x="19" y="4" width="2" height="5" rx="1"/><rect x="3" y="12" width="6" height="5" rx="1"/><rect x="11" y="12" width="6" height="5" rx="1"/><rect x="19" y="12" width="2" height="5" rx="1"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 5.9a8 8 0 0 0-1.7 1L5 5.7 3 9l2 1.5a7 7 0 0 0 0 3L3 15l2 3.4 2.4-1a8 8 0 0 0 1.7 1l.5 3h5l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></svg>',
    fit:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5"/></svg>',
    minus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 18 19 6M12 5h7v7"/></svg>',
    text:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 5h14M12 5v14M8 19h8"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    winMinimize:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>',
    winMaximize:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>',
    winRestore:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 8V5h11v11h-3"/><rect x="5" y="8" width="11" height="11" rx="1"/></svg>',
    collapseTools:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h16M4 12h16M4 18h16"/><path d="m8 9-3 3 3 3m8-6 3 3-3 3"/></svg>',
    more:
      '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
    folderOpen:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8V6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5V10"/><path d="M4 10h17l-2 9H3z"/></svg>'
  };

  function icon(name) {
    return icons[name] || "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uid() {
    return crypto.randomUUID().replaceAll("-", "");
  }

  function assetUrl(asset) {
    const relativePath = asset.previewPath || `assets/${asset.fileName}`;
    const encodedPath = String(relativePath)
      .replaceAll("\\", "/")
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `https://assets.megabox.local/${encodedPath}`;
  }

  function formatBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return new Intl.DateTimeFormat(getLanguage(), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function compactName(value, threshold = 12) {
    const characters = Array.from(String(value ?? ""));
    if (characters.length <= threshold) return characters.join("");
    return `${characters.slice(0, 4).join("")}…${characters.slice(-4).join("")}`;
  }

  const assetHoverPreview = (() => {
    let element = null;
    let frame = null;
    let image = null;
    let title = null;
    let detail = null;
    let showTimer = 0;
    let activeTrigger = null;
    let loadToken = 0;

    function ensureElement() {
      if (element) return;
      element = document.createElement("div");
      element.className = "asset-hover-preview";
      element.setAttribute("aria-hidden", "true");
      element.innerHTML = `
        <div class="asset-hover-preview-frame"><img alt="" draggable="false" /></div>
        <div class="asset-hover-preview-copy">
          <strong></strong>
          <span></span>
        </div>`;
      document.body.append(element);
      frame = element.querySelector(".asset-hover-preview-frame");
      image = element.querySelector("img");
      title = element.querySelector("strong");
      detail = element.querySelector("span");
    }

    function hide() {
      window.clearTimeout(showTimer);
      showTimer = 0;
      activeTrigger = null;
      loadToken += 1;
      element?.classList.remove("visible");
      element?.setAttribute("aria-hidden", "true");
    }

    function position(clientX, clientY) {
      if (!element) return;
      const margin = 12;
      const gap = 18;
      const rect = element.getBoundingClientRect();
      let left = clientX + gap;
      let top = clientY + gap;
      if (left + rect.width > window.innerWidth - margin) {
        left = clientX - rect.width - gap;
      }
      if (top + rect.height > window.innerHeight - margin) {
        top = clientY - rect.height - gap;
      }
      element.style.left = `${Math.max(margin, left)}px`;
      element.style.top = `${Math.max(margin, top)}px`;
    }

    function fitImage(naturalWidth, naturalHeight, clientX, clientY) {
      if (!element || !frame || !image ||
          !Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) ||
          naturalWidth <= 0 || naturalHeight <= 0) {
        return;
      }
      const maxOuterWidth = Math.max(220, Math.min(620, window.innerWidth - 24));
      const maxFrameWidth = maxOuterWidth - 18;
      const maxFrameHeight = Math.max(180, Math.min(540, window.innerHeight * 0.64));
      const scale = Math.min(maxFrameWidth / naturalWidth, maxFrameHeight / naturalHeight);
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      element.style.width = `${width + 20}px`;
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      position(clientX, clientY);
    }

    function show(asset, clientX, clientY) {
      ensureElement();
      if (!element || !frame || !image || !title || !detail) return;
      const token = ++loadToken;
      title.textContent = asset.name || t("untitledAsset");
      detail.textContent = `${Number(asset.width || 0)} × ${Number(asset.height || 0)}`;
      element.classList.add("visible");
      element.setAttribute("aria-hidden", "false");
      image.onload = () => {
        if (token === loadToken) {
          fitImage(image.naturalWidth, image.naturalHeight, clientX, clientY);
          detail.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
        }
      };
      image.onerror = () => {
        if (token === loadToken) {
          fitImage(Number(asset.width || 0), Number(asset.height || 0), clientX, clientY);
        }
      };
      image.src = assetUrl(asset);
      fitImage(
        Number(asset.width || image.naturalWidth || 0),
        Number(asset.height || image.naturalHeight || 0),
        clientX,
        clientY
      );
    }

    function bind(root, resolveAsset) {
      root.addEventListener("pointerover", (event) => {
        const trigger = event.target.closest("[data-asset-preview-id]");
        if (!trigger || trigger === activeTrigger || internalDragActive) return;
        const asset = resolveAsset(trigger.dataset.assetPreviewId);
        if (!asset) return;
        window.clearTimeout(showTimer);
        activeTrigger = trigger;
        const clientX = event.clientX;
        const clientY = event.clientY;
        showTimer = window.setTimeout(() => show(asset, clientX, clientY), 180);
      });
      root.addEventListener("pointerout", (event) => {
        const trigger = event.target.closest("[data-asset-preview-id]");
        if (!trigger || trigger !== activeTrigger) return;
        if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;
        hide();
      });
      root.addEventListener("scroll", hide, true);
      document.addEventListener("pointerdown", hide, true);
      window.addEventListener("blur", hide);
    }

    return { bind, hide };
  })();

  function countLabel(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function quantity(count, singular, plural, unitKey) {
    return getLanguage() === "en-US"
      ? countLabel(count, singular, plural)
      : `${count} ${t(unitKey)}`;
  }

  function colorWithAlpha(color, opacity = 1) {
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color || ""));
    if (!match) return `rgba(241, 182, 97, ${Math.max(0, Math.min(1, Number(opacity) || 0))})`;
    const value = match[1].length === 3
      ? match[1].split("").map((part) => part + part).join("")
      : match[1];
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, Number(opacity) || 0))})`;
  }

  function toast(message, type = "success", timeout = 2800) {
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
    toastStack.append(node);
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(5px)";
      node.style.transition = "180ms ease";
      setTimeout(() => node.remove(), 220);
    }, timeout);
  }

  function invoke(action, payload = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const bridge = window.chrome?.webview;
      if (!bridge) {
        reject(new Error("请从 MegaBox 桌面程序中打开此页面。"));
        return;
      }

      const requestId = `req-${++requestSequence}`;
      pendingRequests.set(requestId, {
        resolve,
        reject,
        onProgress: options.onProgress
      });
      bridge.postMessage(JSON.stringify({ action, requestId, ...payload }));
    });
  }

  if (window.chrome?.webview) {
    window.chrome.webview.addEventListener("message", (event) => {
      let message = event.data;
      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }
      const pending = pendingRequests.get(message?.requestId);
      if (!pending) return;
      if (message.progress) {
        try {
          pending.onProgress?.(message.progress);
        } catch {
        }
        return;
      }
      pendingRequests.delete(message.requestId);
      if (message.ok) {
        pending.resolve(message.payload);
      } else {
        pending.reject(new Error(message.error || "本地操作失败"));
      }
    });
  }

  function isPdfFile(file) {
    return file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  }

  function isSupportedImportFile(file) {
    return (file.type || "").startsWith("image/") ||
      isPdfFile(file) ||
      /\.(png|jpe?g|webp|gif|bmp|tiff?|avif)$/i.test(file.name || "");
  }

  function readBlobAsBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.readAsDataURL(blob);
    });
  }

  async function uploadDroppedFiles(files, payload, callbacks = {}) {
    const list = [...files].filter(isSupportedImportFile);
    const totalBytes = list.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const chunkSize = 512 * 1024;
    let uploadedBytes = 0;
    let count = 0;
    const items = [];

    for (let fileIndex = 0; fileIndex < list.length; fileIndex += 1) {
      const file = list[fileIndex];
      const upload = await invoke("upload.begin", {
        name: file.name,
        size: Number(file.size || 0)
      });
      const uploadId = upload.uploadId;
      try {
        for (let offset = 0; offset < file.size; offset += chunkSize) {
          const chunk = file.slice(offset, Math.min(file.size, offset + chunkSize));
          const data = await readBlobAsBase64(chunk);
          await invoke("upload.chunk", { uploadId, data });
          uploadedBytes += chunk.size;
          callbacks.onRead?.(uploadedBytes, totalBytes, fileIndex + 1, list.length);
        }
        const result = await invoke(
          "upload.finish",
          { uploadId, folderId: payload.folderId || "" },
          { onProgress: callbacks.onImport }
        );
        count += Number(result.count || 0);
        items.push(...(result.items || []));
      } catch (error) {
        invoke("upload.cancel", { uploadId }).catch(() => {});
        throw error;
      }
    }
    return { items, count };
  }

  function bindFileDrop(onImported, getImportPayload = () => ({})) {
    const overlay = document.getElementById("drop-overlay");
    let depth = 0;
    const isInternalDrag = (event) => {
      const types = event.dataTransfer?.types;
      return internalDragActive ||
        types?.includes("application/x-megabox-items") ||
        types?.includes("application/x-megabox-asset");
    };

    window.addEventListener("dragenter", (event) => {
      if (isInternalDrag(event)) {
        depth = 0;
        overlay.hidden = true;
        return;
      }
      if (!event.dataTransfer?.types.includes("Files")) return;
      depth += 1;
      overlay.hidden = false;
    });
    window.addEventListener("dragleave", (event) => {
      if (isInternalDrag(event)) {
        depth = 0;
        overlay.hidden = true;
        return;
      }
      if (!event.dataTransfer?.types.includes("Files")) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) overlay.hidden = true;
    });
    window.addEventListener("dragover", (event) => {
      if (isInternalDrag(event)) return;
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    });
    window.addEventListener("drop", async (event) => {
      if (isInternalDrag(event)) {
        depth = 0;
        overlay.hidden = true;
        return;
      }
      if (!event.dataTransfer?.files?.length) return;
      event.preventDefault();
      depth = 0;
      overlay.hidden = true;
      const droppedFiles = [...event.dataTransfer.files];
      const supportedFiles = droppedFiles.filter(isSupportedImportFile);
      const pdfProgress = supportedFiles.length > 1 || supportedFiles.some(isPdfFile)
        ? openPdfProgressDialog()
        : null;
      try {
        if (!supportedFiles.length) {
          pdfProgress?.close();
          return;
        }
        const result = await uploadDroppedFiles(
          supportedFiles,
          getImportPayload(event),
          {
            onRead: (current, total, fileIndex, fileCount) => {
              pdfProgress?.update({
                stage: "reading",
                current,
                total,
                fileIndex,
                fileCount
              });
            },
            onImport: (progress) => pdfProgress?.update(progress)
          }
        );
        pdfProgress?.finish();
        toast(t("importedAssets", { count: result.count }));
        await onImported?.(result.items || []);
      } catch (error) {
        pdfProgress?.close();
        toast(error.message, "error", 5000);
      }
    });
  }

  function openDialog({
    title,
    message = "",
    inputLabel = "",
    value = "",
    confirmText = t("confirm"),
    danger = false
  }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <form class="modal-card">
          <div class="modal-icon ${danger ? "danger" : ""}">${danger ? icon("trash") : icon("folder")}</div>
          <h2>${escapeHtml(title)}</h2>
          ${message ? `<p>${escapeHtml(message)}</p>` : ""}
          ${
            inputLabel
              ? `<label class="field modal-field"><span>${escapeHtml(inputLabel)}</span><input name="value" value="${escapeHtml(value)}" autocomplete="off" /></label>`
              : ""
          }
          <div class="modal-actions">
            <button type="button" class="button" data-modal-cancel>${t("cancel")}</button>
            <button type="submit" class="button ${danger ? "danger-solid" : "primary"}">${escapeHtml(confirmText)}</button>
          </div>
        </form>`;
      document.body.append(backdrop);
      const form = backdrop.querySelector("form");
      const input = backdrop.querySelector("input");
      const close = (result) => {
        document.removeEventListener("keydown", onKeyDown);
        backdrop.remove();
        resolve(result);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(null);
        }
      };
      backdrop.querySelector("[data-modal-cancel]").addEventListener("click", () => close(null));
      backdrop.addEventListener("pointerdown", (event) => {
        if (event.target === backdrop) close(null);
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        close(inputLabel ? input.value.trim() : true);
      });
      document.addEventListener("keydown", onKeyDown);
      setTimeout(() => {
        if (input) {
          input.focus();
          input.select();
        } else {
          form.querySelector('[type="submit"]')?.focus();
        }
      }, 30);
    });
  }

  function openPdfImportDialog() {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <form class="modal-card pdf-import-dialog">
          <div class="modal-icon">${icon("pdf")}</div>
          <h2>${t("pdfImportTitle")}</h2>
          <label class="field modal-field">
            <span>${t("pdfPageRange")}</span>
            <input name="pageRange" type="text" placeholder="${t("pdfPageRangeHint")}" autocomplete="off" />
          </label>
          <label class="field modal-field">
            <span>${t("pdfResolution")}</span>
            <select name="dpi">
              <option value="75" selected>75 DPI</option>
              <option value="150">150 DPI</option>
              <option value="300">300 DPI</option>
            </select>
          </label>
          <div class="modal-actions">
            <button type="button" class="button" data-modal-cancel>${t("cancel")}</button>
            <button type="submit" class="button primary">${t("pdfImportButton")}</button>
          </div>
        </form>`;
      document.body.append(backdrop);
      const form = backdrop.querySelector("form");
      const pageRange = form.querySelector('[name="pageRange"]');
      const close = (result) => {
        document.removeEventListener("keydown", onKeyDown);
        backdrop.remove();
        resolve(result);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close(null);
        }
      };
      form.querySelector("[data-modal-cancel]").addEventListener("click", () => close(null));
      backdrop.addEventListener("pointerdown", (event) => {
        if (event.target === backdrop) close(null);
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        close({
          pageRange: pageRange.value.trim(),
          dpi: Number(form.querySelector('[name="dpi"]').value) || 75
        });
      });
      document.addEventListener("keydown", onKeyDown);
      setTimeout(() => pageRange.focus(), 30);
    });
  }

  function openPdfProgressDialog() {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-card pdf-progress-dialog" role="dialog" aria-live="polite">
        <div class="modal-icon">${icon("pdf")}</div>
        <h2>${t("importProgressTitle")}</h2>
        <p data-pdf-progress-message>${t("importPreparing")}</p>
        <div class="pdf-progress-track"><span data-pdf-progress-bar></span></div>
        <div class="pdf-progress-meta">
          <span data-pdf-progress-detail>0%</span>
          <span data-pdf-progress-percent>0%</span>
        </div>
      </div>`;
    document.body.append(backdrop);

    const message = backdrop.querySelector("[data-pdf-progress-message]");
    const detail = backdrop.querySelector("[data-pdf-progress-detail]");
    const percentLabel = backdrop.querySelector("[data-pdf-progress-percent]");
    const bar = backdrop.querySelector("[data-pdf-progress-bar]");
    let closed = false;

    const update = (progress = {}) => {
      if (closed) return;
      const stage = progress.stage || "loading";
      const current = Math.max(0, Number(progress.current) || 0);
      const total = Math.max(0, Number(progress.total) || 0);
      let percent = 6;
      if (stage === "reading" && total > 0) {
        percent = Math.round((current / total) * 100);
        message.textContent = t("pdfReading", { percent });
        detail.textContent = `${formatBytes(current)} / ${formatBytes(total)}`;
      } else if (stage === "render" && total > 0) {
        percent = 10 + Math.round((current / total) * 85);
        message.textContent = t("pdfRendering", { current, total });
        detail.textContent = progress.pageNumber
          ? `PDF · ${progress.pageNumber} / ${total}`
          : `${current} / ${total}`;
      } else if (stage === "images" && total > 0) {
        percent = 10 + Math.round((current / total) * 85);
        message.textContent = t("imageImporting", { current, total });
        detail.textContent = `${current} / ${total}`;
      } else if (stage === "importing") {
        percent = 96;
        message.textContent = t("pdfSaving");
        detail.textContent = total > 0 ? `${current} / ${total}` : "";
      } else if (stage === "done") {
        percent = 100;
        message.textContent = t("importFinishing");
        detail.textContent = total > 0 ? `${current} / ${total}` : "";
      } else if (stage === "selected") {
        percent = 10;
        message.textContent = t("pdfRendering", { current: 0, total });
        detail.textContent = `0 / ${total}`;
      } else {
        message.textContent = t("importPreparing");
        detail.textContent = "MegaBox";
      }

      percent = Math.max(0, Math.min(100, percent));
      bar.style.width = `${percent}%`;
      percentLabel.textContent = `${percent}%`;
      bar.classList.toggle("indeterminate", total === 0 && stage !== "done");
    };

    const close = () => {
      if (closed) return;
      closed = true;
      backdrop.remove();
    };
    const finish = () => {
      update({ stage: "done", current: 1, total: 1 });
      setTimeout(close, 360);
    };

    update();
    return { update, finish, close };
  }

  function closeWindow() {
    invoke("window.close").catch(() => window.close());
  }

  function windowControls() {
    return `
      <div class="window-controls">
        <button type="button" class="window-control" data-window-minimize title="${t("windowMinimize")}">${icon("winMinimize")}</button>
        <button type="button" class="window-control" data-window-maximize title="${t("windowMaximize")}">${icon("winMaximize")}</button>
        <button type="button" class="window-control close" data-window-close title="${t("windowClose")}">${icon("close")}</button>
      </div>`;
  }

  const titlebarControls = document.getElementById("window-titlebar-controls");
  if (titlebarControls) titlebarControls.innerHTML = windowControls();
  const titlebarName = document.getElementById("window-titlebar-name");
  const titleElement = document.querySelector("title");
  const updateWindowTitle = () => {
    if (titlebarName) titlebarName.textContent = document.title || "MegaBox";
  };
  if (titleElement) {
    new MutationObserver(updateWindowTitle).observe(titleElement, { childList: true });
  }
  updateWindowTitle();

  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-window-minimize]")) {
      invoke("window.minimize").catch((error) => toast(error.message, "error"));
      return;
    }
    const maximize = event.target.closest("[data-window-maximize]");
    if (maximize) {
      try {
        const result = await invoke("window.toggleMaximize");
        maximize.innerHTML = icon(result.maximized ? "winRestore" : "winMaximize");
        maximize.title = result.maximized ? t("windowRestore") : t("windowMaximize");
      } catch (error) {
        toast(error.message, "error");
      }
      return;
    }
    if (event.target.closest("[data-window-close]")) {
      event.preventDefault();
      closeWindow();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    const dragRegion = event.target.closest("[data-window-drag]");
    if (!dragRegion || event.button !== 0) return;
    invoke("window.dragStart").catch(() => {});
  });

  document.addEventListener("dblclick", (event) => {
    if (!event.target.closest("[data-window-drag]")) return;
    invoke("window.toggleMaximize").then((result) => {
      const button = document.querySelector("[data-window-maximize]");
      if (button) {
        button.innerHTML = icon(result.maximized ? "winRestore" : "winMaximize");
        button.title = result.maximized ? t("windowRestore") : t("windowMaximize");
      }
    }).catch(() => {});
  });

  function emptyLibrary() {
    return {
      assets: [],
      boards: [],
      folders: [],
      tags: [],
      collections: []
    };
  }

  async function startLibrary() {
    let library = emptyLibrary();
    let expandedFolderIds = [];
    try {
      expandedFolderIds = JSON.parse(localStorage.getItem("megabox.expandedFolders") || "[]");
    } catch {
      expandedFolderIds = [];
    }
    const state = {
      library,
      filter: "all",
      query: "",
      folderId: null,
      tagName: null,
      selected: new Set(),
      selectionAnchorKey: null,
      density: "normal",
      expandedFolders: new Set(Array.isArray(expandedFolderIds) ? expandedFolderIds : [])
    };

    const load = async ({ preserveContentScroll = false } = {}) => {
      state.library = await invoke("library.get");
      state.library.folders ||= [];
      state.library.tags ||= [];
      state.library.folders.forEach((folder) => {
        folder.parentId ||= "";
      });
      if (state.folderId && state.folderId !== "__unfiled" &&
          !state.library.folders.some((folder) => folder.id === state.folderId))
      {
        state.folderId = null;
      }
      if (state.tagName && !getTags().some((tag) => tag.name === state.tagName)) {
        state.tagName = null;
      }
      render({ preserveContentScroll });
    };

    const getEntries = () => {
      const assetEntries = (state.library.assets || []).map((asset) => ({
        ...asset,
        entryKind: "image",
        typeLabel: (asset.extension || "").replace(".", "").toUpperCase() || "IMAGE"
      }));
      const boardEntries = (state.library.boards || []).map((board) => ({
        ...board,
        entryKind: "board",
        typeLabel: "BOARD"
      }));
      let folderEntries = [];
      if (state.filter !== "image" && state.filter !== "board" && !state.tagName && state.folderId !== "__unfiled") {
        const visibleFolders = state.folderId
          ? childFolders(state.folderId)
          : state.filter === "all"
            ? childFolders("")
            : [];
        folderEntries = visibleFolders.map((folder) => ({
          ...folder,
          entryKind: "folder",
          typeLabel: "FOLDER"
        }));
      }
      const compareSortOrder = (left, right) => {
        const leftOrder = Number(left.sortOrder);
        const rightOrder = Number(right.sortOrder);
        const leftHasOrder = Number.isSafeInteger(leftOrder);
        const rightHasOrder = Number.isSafeInteger(rightOrder);
        if (!leftHasOrder && !rightHasOrder) return 0;
        if (!leftHasOrder) return -1;
        if (!rightHasOrder) return 1;
        return leftOrder - rightOrder;
      };
      const fileEntries = [...assetEntries, ...boardEntries];
      fileEntries.sort(compareSortOrder);
      let entries = [...folderEntries, ...fileEntries];

      if (state.filter === "image") entries = entries.filter((entry) => entry.entryKind === "image");
      if (state.filter === "board") entries = entries.filter((entry) => entry.entryKind === "board");
      if (state.folderId === "__unfiled") {
        entries = entries.filter((entry) => entry.entryKind === "folder" || !entry.folderId);
      } else if (state.folderId) {
        entries = entries.filter((entry) =>
          entry.entryKind === "folder" || entry.folderId === state.folderId);
      }
      if (state.tagName) {
        entries = entries.filter((entry) =>
          entry.entryKind === "image" && (entry.tags || []).includes(state.tagName));
      }
      if (state.filter === "recent") {
        entries.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
      }

      const query = state.query.trim().toLowerCase();
      if (query) {
        entries = entries.filter((entry) =>
          [entry.name, entry.entryKind, ...(entry.tags || []), folderName(entry.folderId)]
            .join(" ")
            .toLowerCase()
            .includes(query)
        );
      }
      return entries;
    };

    function libraryStorageBytes() {
      let total = 0;
      const countedPdfSources = new Set();
      for (const asset of state.library.assets || []) {
        const sourcePdfFile = asset.sourcePdfFile || "";
        if (sourcePdfFile && !countedPdfSources.has(sourcePdfFile)) {
          countedPdfSources.add(sourcePdfFile);
          total += Number(asset.sourceSize || 0);
        }
        total += Number(asset.size || 0);
      }
      return total;
    }

    const entryKey = (entry) => `${entry.entryKind}:${entry.id}`;
    const assetById = (id) => (state.library.assets || []).find((asset) => asset.id === id);
    const folderById = (id) => (state.library.folders || []).find((folder) => folder.id === id);
    const folderName = (id) => folderById(id)?.name || "";
    const childFolders = (parentId) =>
      (state.library.folders || [])
        .filter((folder) => (folder.parentId || "") === (parentId || ""))
        .sort((left, right) => {
          const leftOrder = Number(left.sortOrder);
          const rightOrder = Number(right.sortOrder);
          const leftHasOrder = Number.isSafeInteger(leftOrder);
          const rightHasOrder = Number.isSafeInteger(rightOrder);
          if (!leftHasOrder && !rightHasOrder) return 0;
          if (!leftHasOrder) return -1;
          if (!rightHasOrder) return 1;
          return leftOrder - rightOrder;
        });
    const folderSubtreeIds = (id) => {
      const result = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const folder of state.library.folders || []) {
          const parentId = folder.parentId || "";
          if (result.has(parentId) && !result.has(folder.id)) {
            result.add(folder.id);
            changed = true;
          }
        }
      }
      return result;
    };
    const folderCount = (id) => {
      const entries = state.library.assets || [];
      if (id === "__unfiled") {
        return entries.filter((entry) => !entry.folderId).length;
      }
      const folderIds = folderSubtreeIds(id);
      return entries.filter((entry) => folderIds.has(entry.folderId || "")).length;
    };
    const folderImageAssets = (id) => {
      const folderIds = folderSubtreeIds(id);
      return (state.library.assets || []).filter((asset) => folderIds.has(asset.folderId || ""));
    };
    const folderDirectAssets = (id) =>
      (state.library.assets || []).filter((asset) => (asset.folderId || "") === id);
    const renderTreeAsset = (asset, depth) => {
      const selected = state.selected.has(`image:${asset.id}`);
      return `
        <div class="nav-item tree-asset-row ${selected ? "selected" : ""}"
             role="button"
             tabindex="0"
             draggable="true"
             data-tree-asset="${escapeHtml(asset.id)}"
             data-asset-preview-id="${escapeHtml(asset.id)}"
             style="--tree-depth:${Math.min(depth, 2)}"
             title="${escapeHtml(asset.name)}">
          <span class="tree-asset-guide"></span>
          <span class="tree-asset-icon">${icon("image")}</span>
          <span class="folder-row-name">${escapeHtml(compactName(asset.name))}</span>
          <span class="tree-asset-actions">
            <button type="button" data-tree-image-delete="${escapeHtml(asset.id)}" title="${t("deleteImage")}">${icon("trash")}</button>
          </span>
        </div>`;
    };
    const saveExpandedFolders = () => {
      localStorage.setItem("megabox.expandedFolders", JSON.stringify([...state.expandedFolders]));
    };
    const setFolderExpanded = (id, expanded) => {
      if (expanded) state.expandedFolders.add(id);
      else state.expandedFolders.delete(id);
      saveExpandedFolders();
    };
    const renderFolderBranch = (parentId = "", depth = 0) => {
      return childFolders(parentId).map((folder) => {
        const children = childFolders(folder.id);
        const directAssets = folderDirectAssets(folder.id);
        const hasChildren = children.length > 0 || directAssets.length > 0;
        const expanded = hasChildren && state.expandedFolders.has(folder.id);
        return `
          <div class="nav-item folder-row ${state.folderId === folder.id ? "active" : ""}"
               role="button"
               tabindex="0"
               draggable="true"
               data-folder-id="${escapeHtml(folder.id)}"
               style="--folder-depth:${Math.min(depth, 2)}">
            <button class="folder-toggle ${hasChildren ? "" : "empty"} ${expanded ? "expanded" : ""}"
                    type="button"
                    ${hasChildren ? `data-folder-toggle="${escapeHtml(folder.id)}"` : "tabindex=\"-1\""}
                    title="${expanded ? t("collapse") : t("expand")}"></button>
            <span class="folder-tree-icon">${icon(expanded ? "folderOpen" : "folder")}</span>
            <span class="folder-row-name">${escapeHtml(folder.name)}</span>
            <span class="nav-count">${folderCount(folder.id)}</span>
            <span class="folder-actions">
              <button data-folder-add-child="${escapeHtml(folder.id)}" title="${t("newSubfolder")}">${icon("plus")}</button>
              <button data-folder-rename="${escapeHtml(folder.id)}" title="${t("rename")}">${icon("edit")}</button>
              <button data-folder-delete="${escapeHtml(folder.id)}" title="${t("delete")}">${icon("trash")}</button>
            </span>
          </div>
          ${expanded
            ? `${renderFolderBranch(folder.id, depth + 1)}${directAssets.map((asset) => renderTreeAsset(asset, depth + 1)).join("")}`
            : ""}`;
      }).join("");
    };
    const getTags = () => {
      const tags = new Map(
        (state.library.tags || []).map((tag) => [
          tag.name,
          { id: tag.id, name: tag.name, color: tag.color || "#8b7cff" }
        ])
      );
      const palette = ["#8b7cff", "#59d8a7", "#f3ad5c", "#68b7ff", "#f16f78", "#d38cff"];
      let legacyIndex = tags.size;
      for (const asset of state.library.assets || []) {
        for (const name of asset.tags || []) {
          if (!tags.has(name)) {
            tags.set(name, { id: `legacy-${name}`, name, color: palette[legacyIndex++ % palette.length] });
          }
        }
      }
      return [...tags.values()];
    };
    const tagCount = (name) =>
      (state.library.assets || []).filter((asset) => (asset.tags || []).includes(name)).length;

    function mosaic(board) {
      const assets = (board.items || [])
        .filter((item) => item.kind === "image")
        .map((item) => assetById(item.assetId))
        .filter(Boolean)
        .slice(0, 4);
      if (!assets.length) {
        return `<div class="board-empty-preview">${icon("board")}<span>${t("blankBoard")}</span></div>`;
      }
      return `<div class="board-mosaic">${assets
        .map((asset) => `<img src="${assetUrl(asset)}" alt="" draggable="false" />`)
        .join("")}</div>`;
    }

    function folderMosaic(folder) {
      const assets = folderImageAssets(folder.id).slice(0, 4);
      if (!assets.length) {
        return `<div class="board-empty-preview">${icon("folder")}<span>${t("emptyFolder")}</span></div>`;
      }
      return `<div class="board-mosaic folder-mosaic">${assets
        .map((asset) => `<img src="${assetUrl(asset)}" alt="" draggable="false" />`)
        .join("")}</div>`;
    }

    function cardTemplate(entry) {
      const selected = state.selected.has(entryKey(entry));
      const name = entry.name || t("untitledAsset");
      const isBoard = entry.entryKind === "board";
      const isFolder = entry.entryKind === "folder";
      const location = folderName(entry.folderId);
      const detail = isFolder
        ? `${quantity(folderImageAssets(entry.id).length, "image", "images", "imageUnit")} · ${quantity(childFolders(entry.id).length, "subfolder", "subfolders", "subfolderUnit")}`
        : isBoard
          ? `${quantity((entry.items || []).length, "object", "objects", "objects")}${location ? ` · ${location}` : ""} · ${formatDate(entry.updatedAt || entry.createdAt)}`
          : `${formatBytes(entry.size)}${location ? ` · ${location}` : ""} · ${formatDate(entry.createdAt)}`;

      return `
        <article class="asset-card ${selected ? "selected" : ""}" data-kind="${entry.entryKind}" data-id="${escapeHtml(entry.id)}" draggable="true" tabindex="0">
          <div class="card-preview">
            ${isFolder ? folderMosaic(entry) : isBoard ? mosaic(entry) : `<img src="${assetUrl(entry)}" alt="" loading="lazy" draggable="false"
              data-asset-preview-id="${escapeHtml(entry.id)}" />`}
            <span class="type-badge ${isBoard ? "board" : isFolder ? "folder" : ""}">${escapeHtml(entry.typeLabel)}</span>
            <div class="card-toolbar">
              <button type="button" title="${isFolder ? t("openFolder") : t("openNewWindow")}" data-card-action="open">${icon("open")}</button>
              ${isBoard
                ? `<button type="button" title="${t("deleteBoardConfirm")}" data-card-action="delete-board">${icon("trash")}</button>`
                : isFolder
                  ? `<button type="button" title="${t("deleteFolder")}" data-card-action="delete-folder">${icon("trash")}</button>`
                  : `<button type="button" title="${t("deleteImage")}" data-card-action="delete-image">${icon("trash")}</button>`}
            </div>
          </div>
          <div class="card-meta">
            <div class="card-title" title="${escapeHtml(name)}">${escapeHtml(compactName(name))}</div>
            <div class="card-detail">${escapeHtml(detail)}</div>
          </div>
        </article>`;
    }

    function render({ preserveContentScroll = false } = {}) {
      const sidebarScrollTop = app.querySelector(".sidebar-scroll")?.scrollTop ?? 0;
      const contentScrollTop = app.querySelector(".content")?.scrollTop ?? 0;
      const entries = getEntries();
      const allTags = getTags();
      const selectedEntries = entries.filter((entry) => state.selected.has(entryKey(entry)));
      const titleMap = {
        all: t("allAssets"),
        recent: t("recent"),
        image: t("images"),
        board: t("boards")
      };
      const currentFolder = state.folderId && state.folderId !== "__unfiled"
        ? folderById(state.folderId)
        : null;
      const pageTitle = state.tagName
        ? `# ${state.tagName}`
        : currentFolder ? currentFolder.name : state.folderId === "__unfiled" ? t("uncategorized") : titleMap[state.filter] || t("allAssets");
      const unfiledAssets = folderDirectAssets("");
      const unfiledExpanded = state.expandedFolders.has("__unfiled");

      app.innerHTML = `
        <div class="app-shell library-shell">
          <aside class="sidebar">
            <div class="brand">
              <div class="brand-mark">M</div>
              <div class="brand-name">MegaBox</div>
              <div class="brand-version">0.2</div>
            </div>
            <div class="sidebar-scroll">
              <div class="sidebar-label">${t("assetSpace")}</div>
              <nav class="nav-list">
                <button class="nav-item ${state.filter === "all" && !state.folderId && !state.tagName ? "active" : ""}" data-filter="all">${icon("library")}<span>${t("allAssets")}</span><span class="nav-count">${(state.library.assets || []).length + (state.library.boards || []).length}</span></button>
                <button class="nav-item ${state.filter === "recent" && !state.folderId && !state.tagName ? "active" : ""}" data-filter="recent">${icon("folderOpen")}<span>${t("recent")}</span></button>
                <button class="nav-item ${state.filter === "image" && !state.folderId && !state.tagName ? "active" : ""}" data-filter="image">${icon("image")}<span>${t("images")}</span><span class="nav-count">${(state.library.assets || []).length}</span></button>
                <button class="nav-item ${state.filter === "board" && !state.folderId && !state.tagName ? "active" : ""}" data-filter="board">${icon("board")}<span>${t("boards")}</span><span class="nav-count">${(state.library.boards || []).length}</span></button>
              </nav>
              <div class="sidebar-divider"></div>
              <div class="sidebar-section-head" data-folder-root-drop>
                <span class="sidebar-label">${t("folders")}</span>
                <button class="sidebar-add-button" data-action="create-folder" title="${t("newFolderTooltip")}">${icon("plus")}</button>
              </div>
              <div class="folder-list">
                ${renderFolderBranch()}
                <div class="nav-item folder-row folder-unfiled ${state.folderId === "__unfiled" ? "active" : ""}" role="button" tabindex="0" data-folder-id="__unfiled">
                  <button class="folder-toggle ${unfiledAssets.length ? "" : "empty"} ${unfiledExpanded ? "expanded" : ""}"
                          type="button"
                          ${unfiledAssets.length ? 'data-unfiled-toggle' : "tabindex=\"-1\""}
                          title="${unfiledExpanded ? t("collapse") : t("expand")}"></button>
                  <span class="folder-tree-icon">${icon(unfiledExpanded ? "folderOpen" : "folder")}</span>
                  <span class="folder-row-name">${t("uncategorized")}</span>
                  <span class="nav-count">${folderCount("__unfiled")}</span>
                </div>
                ${unfiledExpanded ? unfiledAssets.map((asset) => renderTreeAsset(asset, 1)).join("") : ""}
              </div>
              <div class="sidebar-divider"></div>
              <div class="sidebar-section-head">
                <span class="sidebar-label">${t("tags")}</span>
                <button class="sidebar-add-button" data-action="create-tag" title="${t("newTagTooltip")}">${icon("plus")}</button>
              </div>
              <div class="tag-filter-list">
                ${allTags.length
                  ? allTags.map((tag) => `<button class="tag-filter-chip ${state.tagName === tag.name ? "active" : ""}" data-tag-filter="${escapeHtml(tag.name)}">
                      <span class="tag-filter-dot" style="background:${escapeHtml(tag.color)}"></span>
                      <span class="tag-filter-name">${escapeHtml(tag.name)}</span>
                      <span class="tag-filter-count">${tagCount(tag.name)}</span>
                    </button>`).join("")
                  : `<span class="tag-chip">${t("noTags")}</span>`}
              </div>
            </div>
            <div class="sidebar-bottom">
              <button class="nav-item" data-reveal-library>${icon("folderOpen")}<span>${t("openLibraryFolder")}</span></button>
              <button class="nav-item" data-open-preferences>${icon("settings")}<span>${t("preferences")}</span></button>
              <div class="storage-card">
                <div class="storage-head"><span>${t("localLibrary")}</span><span>${t("offline")}</span></div>
                <div class="storage-bar"><span></span></div>
                <div class="storage-foot">${formatBytes(libraryStorageBytes())} · ${t("filesLocal")}</div>
              </div>
            </div>
          </aside>
          <section class="workspace">
            <header class="topbar">
              <label class="search-box">
                ${icon("search")}
                <input id="library-search" type="search" placeholder="${t("searchPlaceholder")}" value="${escapeHtml(state.query)}" autocomplete="off" />
                <span class="search-shortcut">Ctrl K</span>
              </label>
              <div class="toolbar-spacer"></div>
              <button class="button" data-action="import">${icon("upload")}${t("importAssets")}</button>
              <button class="button" data-action="import-pdf">${icon("pdf")}${t("importPdf")}</button>
              <button class="button primary" data-action="new-board">${icon("plus")}${t("newBoard")}</button>
            </header>
            <main class="content">
              <div class="library-heading">
                <div>
                  <div class="eyebrow">Library</div>
                  <h1>${escapeHtml(pageTitle)}</h1>
                  <p>${entries.length ? `${quantity(entries.length, "item", "items", "itemUnit")} ${t("storedOnDevice")}` : state.tagName ? t("tagEmptyHint") : state.folderId ? t("folderDropHint") : t("dragImages")}</p>
                </div>
                <div class="library-heading-actions">
                  <button type="button" class="button ghost" data-action="select-all" title="Ctrl+A">${icon("selectAll")}${t("selectAll")}</button>
                  <div class="view-toggle">
                    <button class="${state.density === "normal" ? "active" : ""}" data-density="normal" title="${t("gridView")}">${icon("grid")}</button>
                    <button class="${state.density === "compact" ? "active" : ""}" data-density="compact" title="${t("compactView")}">${icon("compact")}</button>
                  </div>
                </div>
              </div>
              ${
                entries.length
                  ? `<div class="asset-grid ${state.density === "compact" ? "compact" : ""}">${entries.map(cardTemplate).join("")}</div>`
                  : `<div class="empty-state">
                      <div class="empty-illustration">${icon("image")}</div>
                      <h2>${state.query ? t("searchEmpty") : state.tagName ? t("tagEmpty") : state.folderId ? t("folderEmpty") : t("libraryEmpty")}</h2>
                      <p>${state.query ? t("searchEmptyText") : state.tagName ? t("tagEmptyText") : state.folderId ? t("folderEmptyText") : t("libraryEmptyText")}</p>
                      <button class="button primary" data-action="${state.query ? "clear-search" : "import"}">${state.query ? icon("close") + t("clearSearch") : icon("upload") + t("importAssets")}</button>
                    </div>`
              }
            </main>
          </section>
          ${
            state.selected.size
              ? `<div class="selection-float">
                  <span>${t("selectedItems")} ${state.selected.size}</span>
                  <button class="button ghost" data-action="open-selected">${icon("open")}${t("open")}</button>
                  ${selectedEntries.some((entry) => entry.entryKind === "image") ? `<button class="button primary" data-action="new-board">${icon("board")}${t("saveAsBoard")}</button>` : ""}
                  ${selectedEntries.some((entry) => entry.entryKind === "image" || entry.entryKind === "board") ? `<button class="button danger" data-action="delete-selected">${icon("trash")}${t("delete")}</button>` : ""}
                </div>`
              : ""
          }
        </div>`;
      bindEvents();
      const restoreSidebarScroll = () => {
        const sidebarScroll = app.querySelector(".sidebar-scroll");
        if (sidebarScroll) sidebarScroll.scrollTop = sidebarScrollTop;
      };
      restoreSidebarScroll();
      requestAnimationFrame(restoreSidebarScroll);
      if (preserveContentScroll) {
        const restoreContentScroll = () => {
          const content = app.querySelector(".content");
          if (content) content.scrollTop = contentScrollTop;
        };
        restoreContentScroll();
        requestAnimationFrame(restoreContentScroll);
      }
    }

    function selectCard(entry, additive, rangeSelect = false) {
      const key = entryKey(entry);
      if (rangeSelect && state.selectionAnchorKey) {
        const entries = getEntries().filter((candidate) => candidate.entryKind !== "folder");
        const anchorIndex = entries.findIndex(
          (candidate) => entryKey(candidate) === state.selectionAnchorKey
        );
        const currentIndex = entries.findIndex((candidate) => entryKey(candidate) === key);
        if (anchorIndex >= 0 && currentIndex >= 0) {
          const start = Math.min(anchorIndex, currentIndex);
          const end = Math.max(anchorIndex, currentIndex);
          state.selected = new Set(entries.slice(start, end + 1).map(entryKey));
        } else {
          state.selected.add(key);
        }
      } else if (additive) {
        if (state.selected.has(key)) state.selected.delete(key);
        else state.selected.add(key);
      } else {
        if (!state.selected.has(key) || state.selected.size > 1) {
          state.selected.clear();
          state.selected.add(key);
        }
        state.selectionAnchorKey = key;
      }
      render({ preserveContentScroll: true });
    }

    function selectAllCurrent() {
      const entries = getEntries().filter((entry) => entry.entryKind !== "folder");
      state.selected = new Set(entries.map(entryKey));
      state.selectionAnchorKey = entries.length ? entryKey(entries[0]) : null;
      render({ preserveContentScroll: true });
    }

    async function reorderFiles(movedEntries, targetEntry, insertAfter) {
      if (!movedEntries.length || !targetEntry) return;
      const movedKeys = new Set(movedEntries.map(entryKey));
      if (movedKeys.has(entryKey(targetEntry))) return;
      const currentFiles = getEntries().filter((entry) => entry.entryKind !== "folder");
      const reordered = currentFiles.filter((entry) => !movedKeys.has(entryKey(entry)));
      const targetIndex = reordered.findIndex((entry) => entryKey(entry) === entryKey(targetEntry));
      if (targetIndex < 0) return;
      reordered.splice(targetIndex + (insertAfter ? 1 : 0), 0, ...movedEntries);

      const before = currentFiles.map(entryKey).join("|");
      const after = reordered.map(entryKey).join("|");
      if (before === after) return;
      try {
        await invoke("items.reorderFiles", {
          items: reordered.map((entry) => ({ id: entry.id, kind: entry.entryKind }))
        });
        await load({ preserveContentScroll: true });
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function reorderFolders(draggedFolderId, targetFolderId, insertAfter) {
      const dragged = folderById(draggedFolderId);
      const target = folderById(targetFolderId);
      if (!dragged || !target || dragged.id === target.id) {
        return;
      }
      const parentId = target.parentId || "";
      const siblings = childFolders(parentId).filter((folder) => folder.id !== dragged.id);
      const targetIndex = siblings.findIndex((folder) => folder.id === target.id);
      if (targetIndex < 0) return;
      siblings.splice(targetIndex + (insertAfter ? 1 : 0), 0, dragged);
      try {
        if ((dragged.parentId || "") !== parentId) {
          await invoke("folder.move", { id: dragged.id, parentId });
        }
        await invoke("folders.reorder", {
          items: siblings.map((folder) => ({ id: folder.id }))
        });
        if (parentId) setFolderExpanded(parentId, true);
        await load({ preserveContentScroll: true });
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function openEntry(entry) {
      if (entry.entryKind === "folder") {
        state.folderId = entry.id;
        state.tagName = null;
        state.filter = "all";
        state.query = "";
        state.selected.clear();
        render();
        return;
      }
      try {
        await invoke("item.open", { kind: entry.entryKind, id: entry.id });
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function importFiles() {
      const progressDialog = openPdfProgressDialog();
      try {
        const result = await invoke(
          "files.import",
          {
            folderId: state.folderId && state.folderId !== "__unfiled" ? state.folderId : ""
          },
          { onProgress: (progress) => progressDialog.update(progress) }
        );
        if (!result.canceled) {
          progressDialog.finish();
          toast(t("importedAssets", { count: result.count }));
          await load();
        } else {
          progressDialog.close();
        }
      } catch (error) {
        progressDialog.close();
        toast(error.message, "error", 5000);
      }
    }

    async function importPdfFiles() {
      const options = await openPdfImportDialog();
      if (!options) return;
      const progressDialog = openPdfProgressDialog();
      try {
        const result = await invoke(
          "pdf.import",
          {
            folderId: state.folderId && state.folderId !== "__unfiled" ? state.folderId : "",
            pageRange: options.pageRange,
            dpi: options.dpi
          },
          { onProgress: (progress) => progressDialog.update(progress) }
        );
        if (result.canceled) {
          progressDialog.close();
          return;
        }
        progressDialog.finish();
        state.folderId = result.folder?.id || null;
        state.tagName = null;
        state.filter = "all";
        state.query = "";
        state.selected.clear();
        await load();
        toast(t("pdfImported", {
          count: result.pageCount ?? result.count ?? 0,
          folder: result.folder?.name || ""
        }), "success", 5000);
      } catch (error) {
        progressDialog.close();
        toast(error.message, "error", 6000);
      }
    }

    async function createBoard() {
      try {
        const selectedImageIds = [...state.selected]
          .filter((key) => key.startsWith("image:"))
          .map((key) => key.slice(6));
        const board = await invoke("board.create", {
          name: selectedImageIds.length ? t("referenceBoard") : "",
          assetIds: selectedImageIds,
          folderId: state.folderId && state.folderId !== "__unfiled" ? state.folderId : ""
        });
        await invoke("item.open", { kind: "board", id: board.id });
        state.selected.clear();
        await load();
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function deleteBoard(board) {
      const confirmed = await openDialog({
        title: t("deleteBoardTitle", { name: board.name }),
        message: t("deleteBoardMessage"),
        confirmText: t("deleteBoardConfirm"),
        danger: true
      });
      if (!confirmed) return;
      try {
        await invoke("board.delete", { id: board.id });
        state.selected.delete(entryKey(board));
        toast(t("boardDeleted", { name: board.name }));
        await load();
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function deleteImage(image) {
      const confirmed = await openDialog({
        title: t("deleteImageTitle", { name: compactName(image.name) }),
        message: t("deleteImageMessage"),
        confirmText: t("deleteImageConfirm"),
        danger: true
      });
      if (!confirmed) return;
      try {
        const result = await invoke("asset.delete", { id: image.id });
        state.selected.delete(entryKey(image));
        await load();
        toast(result.fileDeleted === false ? t("imageDeletedFileBusy") : t("imageDeleted"));
      } catch (error) {
        toast(error.message, "error", 5000);
      }
    }

    async function deleteSelectedEntries() {
      const entriesToDelete = getEntries().filter((entry) =>
        state.selected.has(entryKey(entry)) &&
        (entry.entryKind === "image" || entry.entryKind === "board"));
      if (!entriesToDelete.length) return;
      const imageCount = entriesToDelete.filter((entry) => entry.entryKind === "image").length;
      const boardCount = entriesToDelete.filter((entry) => entry.entryKind === "board").length;
      const summary = [
        imageCount ? quantity(imageCount, "image", "images", "imageUnit") : "",
        boardCount ? quantity(boardCount, "board", "boards", "boards") : ""
      ].filter(Boolean).join(` ${t("listSeparator")} `);
      const confirmed = await openDialog({
        title: t("deleteSelectionTitle", { count: entriesToDelete.length }),
        message: t("deleteSelectionMessage", { summary }),
        confirmText: t("confirmDelete"),
        danger: true
      });
      if (!confirmed) return;
      try {
        for (const entry of entriesToDelete.filter((item) => item.entryKind === "board")) {
          await invoke("board.delete", { id: entry.id });
        }
        for (const entry of entriesToDelete.filter((item) => item.entryKind === "image")) {
          await invoke("asset.delete", { id: entry.id });
        }
        state.selected.clear();
        await load();
        toast(t("deletedItems", { count: entriesToDelete.length }));
      } catch (error) {
        toast(error.message, "error", 5000);
      }
    }

    async function createFolder(parentId = null) {
      const parent = parentId ? folderById(parentId) : null;
      const name = await openDialog({
        title: parent ? t("newSubfolderTitle", { name: parent.name }) : t("newFolder"),
        message: parent ? t("newSubfolderMessage") : t("newFolderMessage"),
        inputLabel: t("folderName"),
        value: t("defaultFolderName"),
        confirmText: t("create")
      });
      if (!name) return;
      try {
        const folder = await invoke("folder.create", { name, parentId: parentId || "" });
        if (parentId) setFolderExpanded(parentId, true);
        state.folderId = folder.id;
        state.filter = "all";
        state.selected.clear();
        await load();
        toast(t("folderCreated", { name: folder.name }));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function moveFolder(folder, parentId) {
      if (!folder || folder.parentId === parentId) return;
      try {
        await invoke("folder.move", { id: folder.id, parentId: parentId || "" });
        if (parentId) setFolderExpanded(parentId, true);
        await load();
        toast(parentId ? t("folderMoved") : t("folderMovedRoot"));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function createTag() {
      const name = await openDialog({
        title: t("newTag"),
        message: t("tagCreateMessage"),
        inputLabel: t("tagName"),
        value: t("defaultTagName"),
        confirmText: t("create")
      });
      if (!name) return;
      try {
        const tag = await invoke("tag.create", { name });
        state.tagName = tag.name;
        state.folderId = null;
        state.filter = "all";
        state.selected.clear();
        await load();
        toast(t("tagCreated", { name: tag.name }));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function renameFolder(folder) {
      const name = await openDialog({
        title: t("renameFolder"),
        inputLabel: t("folderName"),
        value: folder.name,
        confirmText: t("save")
      });
      if (!name || name === folder.name) return;
      try {
        await invoke("folder.rename", { id: folder.id, name });
        await load();
        toast(t("folderRenamed"));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function deleteFolder(folder) {
      const confirmed = await openDialog({
        title: t("deleteFolderTitle", { name: folder.name }),
        message: t("deleteFolderMessage"),
        confirmText: t("deleteFolderConfirm"),
        danger: true
      });
      if (!confirmed) return;
      try {
        await invoke("folder.delete", { id: folder.id });
        if (state.folderId === folder.id) state.folderId = null;
        state.selected.clear();
        await load();
        toast(t("folderDeleted"));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    async function moveItemsToFolder(items, folderId) {
      if (!items.length) return;
      try {
        const target = folderId === "__unfiled" ? "" : folderId;
        await invoke("items.assignFolder", { items, folderId: target });
        const targetName = target ? folderName(target) : t("uncategorized");
        state.selected.clear();
        await load();
        toast(t("movedItems", { count: items.length, target: targetName }));
      } catch (error) {
        toast(error.message, "error");
      }
    }

    function bindEvents() {
      app.querySelectorAll(".nav-item[data-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          state.filter = button.dataset.filter;
          state.folderId = null;
          state.tagName = null;
          state.selected.clear();
          render();
        });
      });

      const search = app.querySelector("#library-search");
      search?.addEventListener("input", () => {
        state.query = search.value;
        const selection = search.selectionStart;
        render();
        const next = app.querySelector("#library-search");
        next?.focus();
        next?.setSelectionRange(selection, selection);
      });

      app.querySelectorAll("[data-density]").forEach((button) => {
        button.addEventListener("click", () => {
          state.density = button.dataset.density;
          render();
        });
      });

      app.querySelectorAll(".asset-card").forEach((card) => {
        const entry = getEntries().find(
          (candidate) => candidate.id === card.dataset.id && candidate.entryKind === card.dataset.kind
        );
        card.addEventListener("click", (event) => {
          if (performance.now() < libraryClickSuppressedUntil) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (event.target.closest("[data-card-action]")) return;
          selectCard(entry, event.shiftKey, event.shiftKey);
        });
        card.addEventListener("dblclick", (event) => {
          if (event.target.closest("[data-card-action]")) return;
          openEntry(entry);
        });
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter") openEntry(entry);
          if (event.key === " ") {
            event.preventDefault();
            selectCard(entry, true);
          }
        });
        card.addEventListener("dragstart", (event) => {
          if (libraryMarqueeActive || event.shiftKey) {
            event.preventDefault();
            return;
          }
          internalDragActive = true;
          libraryDragKind = entry.entryKind === "folder" ? "folder" : "files";
          libraryDraggedFolderId = entry.entryKind === "folder" ? entry.id : "";
          libraryDraggedItemKeys = [];
          document.getElementById("drop-overlay").hidden = true;
          if (entry.entryKind === "folder") {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application/x-megabox-folder", entry.id);
            event.dataTransfer.setData("text/plain", entry.name);
            card.classList.add("dragging");
            return;
          }
          const selectedEntries = getEntries().filter((candidate) =>
            candidate.entryKind !== "folder" && state.selected.has(entryKey(candidate)));
          const entriesToMove = state.selected.has(entryKey(entry)) && selectedEntries.length
            ? selectedEntries
            : [entry];
          libraryDraggedItemKeys = entriesToMove.map(entryKey);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/x-megabox-items",
            JSON.stringify(entriesToMove.map((candidate) => ({
              id: candidate.id,
              kind: candidate.entryKind
            })))
          );
          event.dataTransfer.setData("text/plain", entriesToMove.map((candidate) => candidate.name).join(", "));
          card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
          internalDragActive = false;
          libraryDragKind = "";
          libraryDraggedFolderId = "";
          libraryDraggedItemKeys = [];
          document.getElementById("drop-overlay").hidden = true;
          card.classList.remove("dragging");
          app.querySelectorAll(".reorder-before, .reorder-after").forEach((node) => {
            node.classList.remove("reorder-before", "reorder-after");
          });
        });
        card.addEventListener("dragover", (event) => {
          const canReorderFiles =
            libraryDragKind === "files" && entry.entryKind !== "folder";
          const canReorderFolders =
            libraryDragKind === "folder" && entry.entryKind === "folder";
          if ((!canReorderFiles && !canReorderFolders) ||
              state.filter === "recent" ||
              state.tagName ||
              state.query.trim()) {
            return;
          }
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          const rect = card.getBoundingClientRect();
          const insertAfter = event.clientX >= rect.left + rect.width / 2;
          card.classList.toggle("reorder-before", !insertAfter);
          card.classList.toggle("reorder-after", insertAfter);
        });
        card.addEventListener("dragleave", (event) => {
          if (!card.contains(event.relatedTarget)) {
            card.classList.remove("reorder-before", "reorder-after");
          }
        });
        card.addEventListener("drop", async (event) => {
          const canReorderFiles =
            libraryDragKind === "files" && entry.entryKind !== "folder";
          const canReorderFolders =
            libraryDragKind === "folder" && entry.entryKind === "folder";
          if (!canReorderFiles && !canReorderFolders) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const insertAfter = card.classList.contains("reorder-after");
          card.classList.remove("reorder-before", "reorder-after");
          try {
            if (canReorderFolders) {
              await reorderFolders(libraryDraggedFolderId, entry.id, insertAfter);
            } else {
              const requested = new Set(libraryDraggedItemKeys);
              const movedEntries = getEntries().filter((candidate) =>
                candidate.entryKind !== "folder" && requested.has(entryKey(candidate))
              );
              await reorderFiles(movedEntries, entry, insertAfter);
            }
          } catch (error) {
            toast(error.message || t("invalidDrop"), "error");
          }
        });
      });

      const selectionSurface = app.querySelector(".content");
      if (selectionSurface) {
        selectionSurface.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || event.pointerType === "touch") return;
          if (event.target.closest("button, input, textarea, select, a, .library-heading")) return;
          const startedCard = event.target.closest(".asset-card");
          if (!event.shiftKey && startedCard) return;
          const surfaceRect = selectionSurface.getBoundingClientRect();
          if (event.clientX >= surfaceRect.right - 18) return;

          const startX = event.clientX;
          const startY = event.clientY;
          const startedEntryKey = startedCard
            ? `${startedCard.dataset.kind}:${startedCard.dataset.id}`
            : "";
          let lastPointer = { x: startX, y: startY };
          const additive = event.shiftKey;
          const baseSelection = additive ? new Set(state.selected) : new Set();
          let currentSelection = new Set(baseSelection);
          let moved = false;
          const selectableEntries = getEntries().filter((entry) => entry.entryKind !== "folder");
          const marquee = document.createElement("div");
          marquee.className = "library-marquee";
          marquee.hidden = true;
          document.body.append(marquee);
          selectionSurface.classList.add("selection-active");
          libraryMarqueeActive = true;

          const updateMarquee = (pointerEvent) => {
            lastPointer = { x: pointerEvent.clientX, y: pointerEvent.clientY };
            const left = Math.min(startX, pointerEvent.clientX);
            const top = Math.min(startY, pointerEvent.clientY);
            const width = Math.abs(pointerEvent.clientX - startX);
            const height = Math.abs(pointerEvent.clientY - startY);
            if (!moved && width < 4 && height < 4) return;
            moved = true;
            marquee.hidden = false;
            marquee.style.left = `${left}px`;
            marquee.style.top = `${top}px`;
            marquee.style.width = `${width}px`;
            marquee.style.height = `${height}px`;

            const bounds = {
              left,
              top,
              right: left + width,
              bottom: top + height
            };
            currentSelection = new Set(baseSelection);
            for (const entry of selectableEntries) {
              const card = selectionSurface.querySelector(
                `.asset-card[data-kind="${entry.entryKind}"][data-id="${entry.id}"]`
              );
              if (!card) continue;
              const rect = card.getBoundingClientRect();
              const intersects =
                rect.right >= bounds.left &&
                rect.left <= bounds.right &&
                rect.bottom >= bounds.top &&
                rect.top <= bounds.bottom;
              if (intersects) currentSelection.add(entryKey(entry));
            }

            selectionSurface.querySelectorAll(".asset-card").forEach((card) => {
              const key = `${card.dataset.kind}:${card.dataset.id}`;
              const selectable = card.dataset.kind !== "folder";
              const selected = selectable ? currentSelection.has(key) : baseSelection.has(key);
              card.classList.toggle("selected", selected);
            });
          };

          let autoScrollFrame = 0;
          const autoScroll = () => {
            if (!libraryMarqueeActive) return;
            const rect = selectionSurface.getBoundingClientRect();
            const edge = 44;
            let delta = 0;
            if (lastPointer.y < rect.top + edge) {
              delta = -Math.ceil(((rect.top + edge - lastPointer.y) / edge) * 16);
            } else if (lastPointer.y > rect.bottom - edge) {
              delta = Math.ceil(((lastPointer.y - (rect.bottom - edge)) / edge) * 16);
            }
            if (delta !== 0) {
              const previousScroll = selectionSurface.scrollTop;
              selectionSurface.scrollTop += delta;
              if (selectionSurface.scrollTop !== previousScroll) {
                updateMarquee(lastPointer);
              }
            }
            autoScrollFrame = requestAnimationFrame(autoScroll);
          };

          const finishSelection = () => {
            window.removeEventListener("pointermove", updateMarquee);
            window.removeEventListener("pointercancel", finishSelection);
            window.removeEventListener("pointerup", finishSelection);
            cancelAnimationFrame(autoScrollFrame);
            libraryMarqueeActive = false;
            marquee.remove();
            selectionSurface.classList.remove("selection-active");
            if (!moved && event.shiftKey && startedEntryKey) {
              libraryClickSuppressedUntil = performance.now() + 250;
              const entry = getEntries().find(
                (candidate) => entryKey(candidate) === startedEntryKey
              );
              state.selected = baseSelection;
              if (entry) {
                selectCard(entry, true, true);
              } else {
                render({ preserveContentScroll: true });
              }
              return;
            }
            if (moved) {
              libraryClickSuppressedUntil = performance.now() + 250;
            }
            const unchanged =
              currentSelection.size === state.selected.size &&
              [...currentSelection].every((key) => state.selected.has(key));
            state.selected = currentSelection;
            state.selectionAnchorKey = currentSelection.size
              ? [...currentSelection][0]
              : null;
            if (!unchanged) render({ preserveContentScroll: true });
          };

          event.preventDefault();
          window.addEventListener("pointermove", updateMarquee);
          window.addEventListener("pointerup", finishSelection, { once: true });
          window.addEventListener("pointercancel", finishSelection, { once: true });
          autoScrollFrame = requestAnimationFrame(autoScroll);
        });
      }

      app.querySelectorAll(".folder-row").forEach((row) => {
        const folderId = row.dataset.folderId;
        const folder = folderId === "__unfiled" ? null : folderById(folderId);
        const selectFolder = () => {
          state.folderId = folderId;
          state.tagName = null;
          state.filter = "all";
          state.query = "";
          state.selected.clear();
          render();
        };
        row.addEventListener("click", (event) => {
          if (event.target.closest("[data-folder-toggle],[data-unfiled-toggle],[data-folder-add-child],[data-folder-rename],[data-folder-delete]")) return;
          selectFolder();
        });
        row.addEventListener("dblclick", (event) => {
          if (!folder || event.target.closest("button")) return;
          if (!childFolders(folder.id).length) return;
          setFolderExpanded(folder.id, !state.expandedFolders.has(folder.id));
          render();
        });
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectFolder();
          }
        });
        row.addEventListener("dragstart", (event) => {
          if (!folder) {
            event.preventDefault();
            return;
          }
          internalDragActive = true;
          libraryDragKind = "folder";
          libraryDraggedFolderId = folder.id;
          libraryDraggedItemKeys = [];
          document.getElementById("drop-overlay").hidden = true;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-megabox-folder", folder.id);
          event.dataTransfer.setData("text/plain", folder.name);
          row.classList.add("dragging");
        });
        row.addEventListener("dragend", () => {
          internalDragActive = false;
          libraryDragKind = "";
          libraryDraggedFolderId = "";
          libraryDraggedItemKeys = [];
          document.getElementById("drop-overlay").hidden = true;
          row.classList.remove("dragging");
          app.querySelectorAll(".drop-target, .reorder-before, .reorder-after, .reorder-sibling").forEach((node) => {
            node.classList.remove("drop-target", "reorder-before", "reorder-after", "reorder-sibling");
          });
        });
        row.addEventListener("dragover", (event) => {
          if (!libraryDragKind) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          const draggedFolder = folderById(libraryDraggedFolderId);
          const canReorderFolders =
            libraryDragKind === "folder" &&
            folder &&
            draggedFolder &&
            draggedFolder.id !== folder.id;
          const rect = row.getBoundingClientRect();
          const position = (event.clientY - rect.top) / Math.max(1, rect.height);
          const reorderBefore = canReorderFolders && position < 0.28;
          const reorderAfter = canReorderFolders && position > 0.72;
          const reorderSibling = reorderBefore || reorderAfter;
          row.classList.toggle("reorder-sibling", reorderSibling);
          row.classList.toggle("drop-target", !reorderSibling);
          row.classList.toggle("reorder-before", reorderBefore);
          row.classList.toggle("reorder-after", reorderAfter);
        });
        row.addEventListener("dragleave", (event) => {
          if (!row.contains(event.relatedTarget)) {
            row.classList.remove("drop-target", "reorder-before", "reorder-after", "reorder-sibling");
          }
        });
        row.addEventListener("drop", async (event) => {
          event.preventDefault();
          const insertAfter = row.classList.contains("reorder-after");
          const reorderSibling = row.classList.contains("reorder-sibling");
          row.classList.remove("drop-target", "reorder-before", "reorder-after", "reorder-sibling");
          try {
            if (libraryDragKind === "folder") {
              const draggedFolder = folderById(libraryDraggedFolderId);
              if (reorderSibling && draggedFolder && folder) {
                await reorderFolders(draggedFolder.id, folder.id, insertAfter);
              } else {
                await moveFolder(draggedFolder, folder?.id || "");
              }
              return;
            }
            const requested = new Set(libraryDraggedItemKeys);
            const items = getEntries()
              .filter((entry) => requested.has(entryKey(entry)))
              .map((entry) => ({ id: entry.id, kind: entry.entryKind }));
            await moveItemsToFolder(items, folderId);
          } catch {
            toast(t("invalidDrop"), "error");
          }
        });
      });

      app.querySelector("[data-unfiled-toggle]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        setFolderExpanded("__unfiled", !state.expandedFolders.has("__unfiled"));
        render();
      });

      app.querySelectorAll("[data-tree-asset]").forEach((node) => {
        const asset = assetById(node.dataset.treeAsset);
        if (!asset) return;
        const key = `image:${asset.id}`;
        const openAsset = () => {
          invoke("item.open", { kind: "image", id: asset.id }).catch((error) => toast(error.message, "error"));
        };
        node.addEventListener("click", (event) => {
          if (event.target.closest("[data-tree-image-delete]")) return;
          if (state.selected.size === 1 && state.selected.has(key)) {
            openAsset();
            return;
          }
          state.folderId = asset.folderId || "__unfiled";
          state.tagName = null;
          state.filter = "all";
          state.query = "";
          state.selected.clear();
          state.selected.add(key);
          render();
        });
        node.querySelector("[data-tree-image-delete]")?.addEventListener("click", (event) => {
          event.stopPropagation();
          deleteImage({ ...asset, entryKind: "image" });
        });
        node.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            openAsset();
          }
        });
        node.addEventListener("dragstart", (event) => {
          internalDragActive = true;
          libraryDragKind = "files";
          libraryDraggedFolderId = "";
          libraryDraggedItemKeys = [`image:${asset.id}`];
          document.getElementById("drop-overlay").hidden = true;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/x-megabox-items",
            JSON.stringify([{ id: asset.id, kind: "image" }])
          );
          event.dataTransfer.setData("text/plain", asset.name);
          node.classList.add("dragging");
        });
        node.addEventListener("dragend", () => {
          internalDragActive = false;
          libraryDragKind = "";
          libraryDraggedFolderId = "";
          libraryDraggedItemKeys = [];
          document.getElementById("drop-overlay").hidden = true;
          node.classList.remove("dragging");
        });
      });

      app.querySelectorAll("[data-folder-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const id = button.dataset.folderToggle;
          setFolderExpanded(id, !state.expandedFolders.has(id));
          render();
        });
      });

      app.querySelectorAll("[data-folder-add-child]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          createFolder(button.dataset.folderAddChild);
        });
      });

      app.querySelectorAll("[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.dataset.tagFilter;
          state.tagName = state.tagName === name ? null : name;
          state.folderId = null;
          state.filter = "all";
          state.query = "";
          state.selected.clear();
          render();
        });
      });

      app.querySelectorAll("[data-folder-rename]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const folder = folderById(button.dataset.folderRename);
          if (folder) renameFolder(folder);
        });
      });

      app.querySelectorAll("[data-folder-delete]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const folder = folderById(button.dataset.folderDelete);
          if (folder) deleteFolder(folder);
        });
      });

      const rootDrop = app.querySelector("[data-folder-root-drop]");
      rootDrop?.addEventListener("dragover", (event) => {
        if (!event.dataTransfer?.types.includes("application/x-megabox-folder")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        rootDrop.classList.add("drop-target");
      });
      rootDrop?.addEventListener("dragleave", (event) => {
        if (!rootDrop.contains(event.relatedTarget)) rootDrop.classList.remove("drop-target");
      });
      rootDrop?.addEventListener("drop", (event) => {
        const folderId = event.dataTransfer?.getData("application/x-megabox-folder");
        if (!folderId) return;
        event.preventDefault();
        rootDrop.classList.remove("drop-target");
        moveFolder(folderById(folderId), "");
      });

      app.querySelectorAll("[data-card-action]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const card = button.closest(".asset-card");
          const entry = getEntries().find(
            (candidate) => candidate.id === card.dataset.id && candidate.entryKind === card.dataset.kind
          );
          if (button.dataset.cardAction === "open") openEntry(entry);
          if (button.dataset.cardAction === "delete-board") deleteBoard(entry);
          if (button.dataset.cardAction === "delete-image") deleteImage(entry);
          if (button.dataset.cardAction === "delete-folder") deleteFolder(entry);
        });
      });

      app.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
          const action = button.dataset.action;
          if (action === "import") await importFiles();
          if (action === "import-pdf") await importPdfFiles();
          if (action === "new-board") await createBoard();
          if (action === "select-all") selectAllCurrent();
          if (action === "create-folder") {
            await createFolder(state.folderId && state.folderId !== "__unfiled" ? state.folderId : null);
          }
          if (action === "create-tag") await createTag();
          if (action === "delete-selected") await deleteSelectedEntries();
          if (action === "open-selected") {
            const entries = getEntries().filter((entry) => state.selected.has(entryKey(entry)));
            for (const entry of entries.slice(0, 8)) await openEntry(entry);
          }
          if (action === "clear-search") {
            state.query = "";
            render();
          }
        });
      });

      app.querySelector("[data-reveal-library]")?.addEventListener("click", () => {
        invoke("app.revealLibrary").catch((error) => toast(error.message, "error"));
      });
      app.querySelector("[data-open-preferences]")?.addEventListener("click", () => {
        invoke("app.openPreferences").catch((error) => toast(error.message, "error"));
      });
    }

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "a" &&
          !document.querySelector(".modal-backdrop") &&
          !event.target.matches("input, textarea, select, [contenteditable=true]")) {
        event.preventDefault();
        selectAllCurrent();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        app.querySelector("#library-search")?.focus();
      }
      if (event.key === "Escape") {
        state.selected.clear();
        state.selectionAnchorKey = null;
        render();
      }
      if (event.key === "Enter" && state.selected.size) {
        const entries = getEntries().filter((entry) => state.selected.has(entryKey(entry)));
        entries.forEach(openEntry);
      }
    });

    assetHoverPreview.bind(app, (assetId) =>
      (state.library.assets || []).find((asset) => asset.id === assetId));
    bindFileDrop(load, (event) => {
      const targetFolderId = event.target.closest(".folder-row")?.dataset.folderId;
      const resolvedFolderId = targetFolderId === "__unfiled"
        ? ""
        : targetFolderId || (state.folderId && state.folderId !== "__unfiled" ? state.folderId : "");
      return { folderId: resolvedFolderId };
    });
    window.addEventListener("focus", () => {
      document.documentElement.lang = getLanguage();
      load({ preserveContentScroll: true });
    });
    window.addEventListener("storage", (event) => {
      if (event.key === "megabox.settings.language") {
        document.documentElement.lang = getLanguage();
        load();
      }
    });
    await load();
  }

  async function startImageViewer(id) {
    const [loadedAsset, library] = await Promise.all([
      invoke("asset.get", { id }),
      invoke("library.get")
    ]);
    let asset = loadedAsset;
    if (!asset) throw new Error(t("imageMissing"));
    asset.tags ||= [];

    const tagPalette = ["#8b7cff", "#59d8a7", "#f3ad5c", "#68b7ff", "#f16f78", "#d38cff"];
    let tagOptions = (library.tags || []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color || "#8b7cff"
    }));
    const mergeAssetTags = () => {
      const names = new Set(tagOptions.map((tag) => tag.name));
      for (const item of library.assets || []) {
        for (const name of item.tags || []) {
          if (!names.has(name)) {
            names.add(name);
            tagOptions.push({ id: `legacy-${name}`, name, color: tagPalette[tagOptions.length % tagPalette.length] });
          }
        }
      }
    };
    mergeAssetTags();

    const state = {
      asset,
      zoom: 1,
      panX: 0,
      panY: 0,
      selectedNoteId: null,
      tagPickerOpen: false,
      naturalWidth: 0,
      naturalHeight: 0
    };
    let renderedLanguage = getLanguage();

    function cropStyle(crop = {}) {
      return `inset(${Number(crop.top || 0)}% ${Number(crop.right || 0)}% ${Number(crop.bottom || 0)}% ${Number(crop.left || 0)}%)`;
    }

    function render() {
      document.title = `${asset.name} — MegaBox`;
      app.innerHTML = `
        <div class="viewer-shell">
          <main class="viewer-main">
            <header class="viewer-bar">
              <div class="viewer-title"><strong title="${escapeHtml(asset.name)}">${escapeHtml(compactName(asset.name))}</strong><span>${t("imageViewer")}</span></div>
              <div class="bar-divider"></div>
              <div class="save-state" id="image-save-state">${t("saved")}</div>
              <div class="toolbar-spacer"></div>
              <button class="icon-button" data-zoom-out title="${t("zoomOut")}">${icon("minus")}</button>
              <span class="zoom-readout" id="image-zoom">100%</span>
              <button class="icon-button" data-zoom-in title="${t("zoomIn")}">${icon("plus")}</button>
              <button class="icon-button" data-zoom-fit title="${t("fitWindow")}">${icon("fit")}</button>
            </header>
            <div class="viewer-stage image-stage" id="image-stage">
              <div class="image-canvas" id="image-canvas">
                <img id="main-image" src="${assetUrl(asset)}" alt="${escapeHtml(asset.name)}" draggable="false" style="clip-path:${cropStyle(asset.crop)}" />
              </div>
              <div class="image-annotations" id="image-annotations"></div>
            </div>
          </main>
          <aside class="inspector">
            <div class="inspector-head"><strong>${t("properties")}</strong><span>${t("singleImage")}</span></div>
            <div class="inspector-body" id="image-inspector"></div>
          </aside>
        </div>`;
      bindEvents();
      renderAnnotations();
      renderInspector();
    }

    function renderInspector() {
      const selectedNote = (asset.annotations || []).find((note) => note.id === state.selectedNoteId);
      const crop = asset.crop || {};
      const inspector = document.getElementById("image-inspector");

      if (selectedNote) {
        const noteColor = selectedNote.color || "#f1b661";
        const noteTextColor = selectedNote.textColor || "#20180c";
        const noteOpacity = Math.round(Math.max(0, Math.min(1, Number(selectedNote.backgroundOpacity ?? 1))) * 100);
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("annotationText")}</span><button data-note-close>${t("deselect")}</button></div>
            <div class="field"><label>${t("content")}</label><textarea data-note-edit="text">${escapeHtml(selectedNote.text)}</textarea></div>
            <div class="property-row" style="margin-top:8px">
              <div class="field"><label>${t("backgroundColor")}</label><input type="color" data-note-edit="color" value="${escapeHtml(noteColor)}" /></div>
              <div class="field"><label>${t("textColor")}</label><input type="color" data-note-edit="textColor" value="${escapeHtml(noteTextColor)}" /></div>
            </div>
            <div class="field note-opacity-field">
              <label data-note-opacity-label>${t("backgroundOpacity")} ${noteOpacity}%</label>
              <div class="note-opacity-controls">
                <input type="range" min="0" max="100" step="1" data-note-opacity value="${noteOpacity}" />
                <input type="number" min="0" max="100" step="1" data-note-opacity value="${noteOpacity}" />
              </div>
            </div>
            <div class="property-row">
              <div class="field"><label>X %</label><input type="number" min="0" max="100" step="0.1" data-note-position="x" value="${Number(selectedNote.x ?? 50)}" /></div>
              <div class="field"><label>Y %</label><input type="number" min="0" max="100" step="0.1" data-note-position="y" value="${Number(selectedNote.y ?? 50)}" /></div>
            </div>
            <div class="muted-box" style="margin-top:8px">${t("notePositionHint")}</div>
            <button class="button danger" data-note-delete style="width:100%;margin-top:8px">${icon("trash")}${t("deleteAnnotation")}</button>
          </section>`;
        bindInspectorEvents();
        return;
      }

      inspector.innerHTML = `
        <section class="property-section">
          <div class="property-title"><span>${t("file")}</span></div>
          <div class="field"><label>${t("boardName")}</label><input data-asset-field="name" value="${escapeHtml(asset.name)}" /></div>
          <div class="property-row" style="margin-top:8px">
            <div class="field"><label>${t("width")}</label><input value="${state.naturalWidth || "—"}" readonly /></div>
            <div class="field"><label>${t("height")}</label><input value="${state.naturalHeight || "—"}" readonly /></div>
          </div>
          <div class="file-facts" style="margin-top:8px">
            <div class="file-fact"><span>${t("format")}</span><b>${escapeHtml((asset.extension || "").replace(".", "").toUpperCase())}</b></div>
            <div class="file-fact"><span>${t("size")}</span><b>${formatBytes(asset.size)}</b></div>
            ${asset.pdfPageNumber ? `<div class="file-fact"><span>${t("pdfPage")}</span><b>${asset.pdfPageNumber} / ${asset.pdfPageCount || "?"}</b></div>` : ""}
            <div class="file-fact"><span>${t("importedAt")}</span><b>${formatDate(asset.createdAt)}</b></div>
          </div>
        </section>
        <section class="property-section">
          <div class="property-title"><span>${t("crop")}</span><button data-crop-reset>${t("reset")}</button></div>
          <div class="property-row paired-row">
            <div class="field paired-field"><label>${t("leftPercent")}</label><input class="paired-number" type="number" min="0" max="90" data-crop="left" value="${Number(crop.left || 0)}" /><input class="paired-slider" type="range" min="0" max="90" step="1" data-crop="left" value="${Number(crop.left || 0)}" /></div>
            <div class="field paired-field"><label>${t("topPercent")}</label><input class="paired-number" type="number" min="0" max="90" data-crop="top" value="${Number(crop.top || 0)}" /><input class="paired-slider" type="range" min="0" max="90" step="1" data-crop="top" value="${Number(crop.top || 0)}" /></div>
          </div>
          <div class="property-row paired-row">
            <div class="field paired-field"><label>${t("rightPercent")}</label><input class="paired-number" type="number" min="0" max="90" data-crop="right" value="${Number(crop.right || 0)}" /><input class="paired-slider" type="range" min="0" max="90" step="1" data-crop="right" value="${Number(crop.right || 0)}" /></div>
            <div class="field paired-field"><label>${t("bottomPercent")}</label><input class="paired-number" type="number" min="0" max="90" data-crop="bottom" value="${Number(crop.bottom || 0)}" /><input class="paired-slider" type="range" min="0" max="90" step="1" data-crop="bottom" value="${Number(crop.bottom || 0)}" /></div>
          </div>
          <div class="muted-box">${t("cropHint")}</div>
        </section>
        <section class="property-section">
          <div class="property-title"><span>${t("tags")}</span><button data-tag-picker-toggle>${state.tagPickerOpen ? t("collapse") : `${icon("plus")}${t("add")}`}</button></div>
          <div class="asset-tag-list">
            ${(asset.tags || []).length
              ? asset.tags.map((name) => {
                  const tag = tagOptions.find((candidate) => candidate.name === name);
                  return `<span class="asset-tag" style="--tag-color:${escapeHtml(tag?.color || "#8b7cff")}">
                    <span>${escapeHtml(name)}</span>
                    <button type="button" data-tag-remove="${escapeHtml(name)}" title="${t("removeTag")}">${icon("close")}</button>
                  </span>`;
                }).join("")
              : `<div class="muted-box">${t("noTagsImageHint")}</div>`}
          </div>
          ${state.tagPickerOpen ? `
            <div class="tag-picker-panel">
              <div class="tag-picker-list">
                ${tagOptions.length
                  ? tagOptions.map((tag) => {
                      const selected = (asset.tags || []).includes(tag.name);
                      return `<button type="button" class="tag-picker-option ${selected ? "selected" : ""}" data-tag-toggle="${escapeHtml(tag.name)}">
                        <span class="tag-filter-dot" style="background:${escapeHtml(tag.color)}"></span>
                        <span>${escapeHtml(tag.name)}</span>
                        <span class="tag-picker-check">${selected ? "✓" : ""}</span>
                      </button>`;
                    }).join("")
                  : `<div class="muted-box">${t("noAvailableTags")}</div>`}
              </div>
              <button type="button" class="button tag-create-button" data-tag-create>${icon("plus")}${t("newTag")}</button>
            </div>` : ""}
        </section>
        <section class="property-section">
          <div class="property-title"><span>${t("annotations")}</span><button data-note-add>${icon("plus")}${t("add")}</button></div>
          <div class="annotation-list">
            ${
              (asset.annotations || []).length
                ? asset.annotations
                    .map(
                      (note) => `<button class="annotation-row" data-note-select="${note.id}">
                        <span class="annotation-swatch" style="background:${escapeHtml(note.color)}"></span>
                        <span>${escapeHtml(note.text || t("emptyAnnotation"))}</span>
                      </button>`
                    )
                    .join("")
                : `<div class="muted-box">${t("noAnnotationsImageHint")}</div>`
            }
          </div>
        </section>`;
      bindInspectorEvents();
    }

    function renderAnnotations() {
      const layer = document.getElementById("image-annotations");
      layer.innerHTML = (asset.annotations || [])
        .map(
          (note) => `<div class="image-note ${note.id === state.selectedNoteId ? "selected" : ""}"
            data-note-id="${note.id}"
            style="left:${Number(note.x)}%;top:${Number(note.y)}%;background:${colorWithAlpha(note.color, note.backgroundOpacity ?? 1)};color:${escapeHtml(note.textColor)}">${escapeHtml(note.text)}</div>`
        )
        .join("");
      layer.querySelectorAll("[data-note-id]").forEach((node) => {
        node.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          event.preventDefault();
          state.selectedNoteId = node.dataset.noteId;
          layer.querySelectorAll("[data-note-id]").forEach((candidate) => {
            candidate.classList.toggle("selected", candidate === node);
          });
          renderInspector();

          const note = (asset.annotations || []).find((item) => item.id === state.selectedNoteId);
          const stage = document.getElementById("image-stage");
          if (!note || !stage) return;
          const rect = stage.getBoundingClientRect();
          const startX = event.clientX;
          const startY = event.clientY;
          const originalX = Number(note.x ?? 50);
          const originalY = Number(note.y ?? 50);
          try {
            node.setPointerCapture(event.pointerId);
          } catch {
          }

          const move = (moveEvent) => {
            note.x = Math.max(0, Math.min(100, originalX + ((moveEvent.clientX - startX) / rect.width) * 100));
            note.y = Math.max(0, Math.min(100, originalY + ((moveEvent.clientY - startY) / rect.height) * 100));
            node.style.left = `${note.x}%`;
            node.style.top = `${note.y}%`;
            const xInput = document.querySelector('[data-note-position="x"]');
            const yInput = document.querySelector('[data-note-position="y"]');
            if (xInput) xInput.value = note.x.toFixed(1);
            if (yInput) yInput.value = note.y.toFixed(1);
            saveAsset({ annotations: asset.annotations });
          };
          const end = () => {
            node.removeEventListener("pointermove", move);
            node.removeEventListener("pointerup", end);
            node.removeEventListener("pointercancel", end);
            renderAnnotations();
          };
          node.addEventListener("pointermove", move);
          node.addEventListener("pointerup", end, { once: true });
          node.addEventListener("pointercancel", end, { once: true });
        });
      });
    }

    let saveTimer;
    function saveAsset(updates) {
      const status = document.getElementById("image-save-state");
      if (status) {
        status.textContent = t("saving");
        status.classList.add("dirty");
      }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          asset = await invoke("asset.update", { id: asset.id, updates });
          if (status) {
            status.textContent = t("saved");
            status.classList.remove("dirty");
          }
        } catch (error) {
          toast(error.message, "error");
        }
      }, 280);
    }

    function bindInspectorEvents() {
      const inspector = document.getElementById("image-inspector");
      inspector.querySelectorAll("[data-asset-field]").forEach((input) => {
        input.addEventListener("input", () => {
          if (input.dataset.assetField === "name") asset.name = input.value;
          if (input.dataset.assetField === "tags") {
            asset.tags = input.value.split(",").map((tag) => tag.trim()).filter(Boolean);
          }
          saveAsset({ [input.dataset.assetField]: asset[input.dataset.assetField] });
          const title = document.querySelector(".viewer-title strong");
          if (title) {
            title.textContent = compactName(asset.name);
            title.title = asset.name;
          }
        });
      });

      inspector.querySelectorAll("[data-crop]").forEach((input) => {
        input.addEventListener("input", () => {
          const cropKey = input.dataset.crop;
          const value = Math.max(0, Math.min(90, Number(input.value) || 0));
          asset.crop = { ...(asset.crop || {}), [cropKey]: value };
          inspector.querySelectorAll(`[data-crop="${cropKey}"]`).forEach((paired) => {
            if (paired !== input) paired.value = value;
          });
          document.getElementById("main-image").style.clipPath = cropStyle(asset.crop);
          saveAsset({ crop: asset.crop });
        });
      });

      inspector.querySelector("[data-crop-reset]")?.addEventListener("click", () => {
        asset.crop = { left: 0, top: 0, right: 0, bottom: 0 };
        document.getElementById("main-image").style.clipPath = cropStyle(asset.crop);
        saveAsset({ crop: asset.crop });
        renderInspector();
      });

      const updateAssetTags = (tags) => {
        asset.tags = [...new Set(tags.filter(Boolean))];
        saveAsset({ tags: asset.tags });
        renderInspector();
      };

      inspector.querySelector("[data-tag-picker-toggle]")?.addEventListener("click", () => {
        state.tagPickerOpen = !state.tagPickerOpen;
        renderInspector();
      });

      inspector.querySelectorAll("[data-tag-remove]").forEach((button) => {
        button.addEventListener("click", () => {
          updateAssetTags((asset.tags || []).filter((name) => name !== button.dataset.tagRemove));
        });
      });

      inspector.querySelectorAll("[data-tag-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.dataset.tagToggle;
          const nextTags = new Set(asset.tags || []);
          if (nextTags.has(name)) nextTags.delete(name);
          else nextTags.add(name);
          updateAssetTags([...nextTags]);
        });
      });

      inspector.querySelector("[data-tag-create]")?.addEventListener("click", async () => {
        const name = await openDialog({
          title: t("newTag"),
          message: t("imageTagCreateMessage"),
          inputLabel: t("tags"),
          value: t("newTag"),
          confirmText: t("createAndAdd")
        });
        if (!name) return;
        try {
          const tag = await invoke("tag.create", { name });
          const existingIndex = tagOptions.findIndex((option) => option.name === tag.name);
          if (existingIndex >= 0) tagOptions[existingIndex] = tag;
          else tagOptions.push(tag);
          state.tagPickerOpen = true;
          updateAssetTags([...(asset.tags || []), tag.name]);
          toast(t("tagCreatedAndAdded", { name: tag.name }));
        } catch (error) {
          toast(error.message, "error");
        }
      });

      inspector.querySelector("[data-note-add]")?.addEventListener("click", () => {
        const note = {
          id: uid(),
          text: t("defaultTextAnnotation"),
          color: "#f1b661",
          textColor: "#20180c",
          backgroundOpacity: 1,
          x: 46 + Math.random() * 8,
          y: 18 + Math.random() * 8
        };
        asset.annotations = [...(asset.annotations || []), note];
        state.selectedNoteId = note.id;
        saveAsset({ annotations: asset.annotations });
        renderAnnotations();
        renderInspector();
      });

      inspector.querySelector("[data-note-close]")?.addEventListener("click", () => {
        state.selectedNoteId = null;
        renderAnnotations();
        renderInspector();
      });

      inspector.querySelector("[data-note-delete]")?.addEventListener("click", () => {
        asset.annotations = (asset.annotations || []).filter((note) => note.id !== state.selectedNoteId);
        state.selectedNoteId = null;
        saveAsset({ annotations: asset.annotations });
        renderAnnotations();
        renderInspector();
      });

      inspector.querySelectorAll("[data-note-edit]").forEach((input) => {
        input.addEventListener("input", () => {
          const note = (asset.annotations || []).find((item) => item.id === state.selectedNoteId);
          if (!note) return;
          note[input.dataset.noteEdit] = input.value;
          saveAsset({ annotations: asset.annotations });
          renderAnnotations();
        });
      });

      inspector.querySelectorAll("[data-note-opacity]").forEach((input) => {
        input.addEventListener("input", () => {
          const note = (asset.annotations || []).find((item) => item.id === state.selectedNoteId);
          if (!note) return;
          const percentage = Math.max(0, Math.min(100, Number(input.value) || 0));
          note.backgroundOpacity = percentage / 100;
          inspector.querySelectorAll("[data-note-opacity]").forEach((paired) => {
            if (paired !== input) paired.value = percentage;
          });
          const label = inspector.querySelector("[data-note-opacity-label]");
          if (label) label.textContent = `${t("backgroundOpacity")} ${Math.round(percentage)}%`;
          saveAsset({ annotations: asset.annotations });
          renderAnnotations();
        });
      });

      inspector.querySelectorAll("[data-note-position]").forEach((input) => {
        input.addEventListener("input", () => {
          const note = (asset.annotations || []).find((item) => item.id === state.selectedNoteId);
          if (!note) return;
          note[input.dataset.notePosition] = Math.max(0, Math.min(100, Number(input.value) || 0));
          saveAsset({ annotations: asset.annotations });
          renderAnnotations();
        });
      });

      inspector.querySelectorAll("[data-note-select]").forEach((button) => {
        button.addEventListener("click", () => {
          state.selectedNoteId = button.dataset.noteSelect;
          renderAnnotations();
          renderInspector();
        });
      });
    }

    function applyTransform() {
      const canvas = document.getElementById("image-canvas");
      if (canvas) canvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
      const readout = document.getElementById("image-zoom");
      if (readout) readout.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    function setZoom(value) {
      const stage = document.getElementById("image-stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const anchorX = rect.width / 2;
      const anchorY = rect.height / 2;
      const worldX = (anchorX - state.panX) / state.zoom;
      const worldY = (anchorY - state.panY) / state.zoom;
      state.zoom = Math.max(0.1, Math.min(8, value));
      state.panX = anchorX - worldX * state.zoom;
      state.panY = anchorY - worldY * state.zoom;
      applyTransform();
    }

    function bindEvents() {
      const stage = document.getElementById("image-stage");
      const image = document.getElementById("main-image");
      image.addEventListener("load", () => {
        state.naturalWidth = image.naturalWidth;
        state.naturalHeight = image.naturalHeight;
        renderInspector();
      });

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originalX = 0;
      let originalY = 0;

      stage.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".image-note")) return;
        if (event.button !== 0) return;
        if (state.selectedNoteId) {
          state.selectedNoteId = null;
          renderAnnotations();
          renderInspector();
        }
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        originalX = state.panX;
        originalY = state.panY;
        stage.classList.add("dragging");
        stage.setPointerCapture(event.pointerId);
      });
      stage.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        state.panX = originalX + event.clientX - startX;
        state.panY = originalY + event.clientY - startY;
        applyTransform();
      });
      stage.addEventListener("pointerup", () => {
        dragging = false;
        stage.classList.remove("dragging");
      });
      stage.addEventListener("wheel", (event) => {
        event.preventDefault();
        setZoom(state.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
      }, { passive: false });

      document.querySelector("[data-zoom-in]").addEventListener("click", () => setZoom(state.zoom * 1.15));
      document.querySelector("[data-zoom-out]").addEventListener("click", () => setZoom(state.zoom / 1.15));
      document.querySelector("[data-zoom-fit]").addEventListener("click", () => {
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        applyTransform();
      });
      applyTransform();
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "0" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        applyTransform();
      }
    });

    window.addEventListener("focus", () => {
      const language = getLanguage();
      if (language !== renderedLanguage) {
        renderedLanguage = language;
        document.documentElement.lang = language;
        render();
      }
    });
    window.addEventListener("storage", (event) => {
      if (event.key === "megabox.settings.language") {
        const language = getLanguage();
        if (language !== renderedLanguage) {
          renderedLanguage = language;
          document.documentElement.lang = language;
          render();
        }
      }
    });
    render();
  }

  async function startBoardViewer(id) {
    const [board, library] = await Promise.all([
      invoke("board.get", { id }),
      invoke("library.get")
    ]);
    if (!board) throw new Error(t("boardMissing"));

    const assetsById = new Map((library.assets || []).map((asset) => [asset.id, asset]));
    let boardFolders = library.folders || [];
    const naturalSizeCache = new Map();
    let expandedBoardFolders = [];
    let boardPanelState = {};
    try {
      expandedBoardFolders = JSON.parse(localStorage.getItem("megabox.boardExpandedFolders") || "[]");
      boardPanelState = JSON.parse(localStorage.getItem("megabox.boardPanelState") || "{}");
    } catch {
      expandedBoardFolders = [];
      boardPanelState = {};
    }
    const state = {
      board,
      assetsById,
      selectedId: null,
      selectedIds: new Set(),
      assetQuery: "",
      zoom: Number(board.viewport?.zoom || 1),
      panX: Number(board.viewport?.x || 0),
      panY: Number(board.viewport?.y || 0),
      spaceDown: false,
      dirty: false,
      saveTimer: null,
      pendingItemClick: null,
      expandedFolders: new Set(Array.isArray(expandedBoardFolders) ? expandedBoardFolders : []),
      leftCollapsed: Boolean(boardPanelState.leftCollapsed),
      rightCollapsed: Boolean(boardPanelState.rightCollapsed),
      toolbarsCollapsed: Boolean(boardPanelState.toolbarsCollapsed)
    };
    let renderedLanguage = getLanguage();
    if (state.toolbarsCollapsed) {
      state.leftCollapsed = true;
      state.rightCollapsed = true;
    }

    const getSelected = () => (state.board.items || []).find((item) => item.id === state.selectedId);
    const assetFor = (item) => assetsById.get(item.assetId);
    const selectOnly = (id) => {
      state.selectedIds.clear();
      if (id) {
        state.selectedIds.add(id);
        state.selectedId = id;
      } else {
        state.selectedId = null;
      }
    };

    function normalizeLegacyPortals() {
      let changed = false;
      const targetWidth = Math.max(112, 112 / state.zoom);
      const targetHeight = Math.max(40, 40 / state.zoom);
      for (const item of state.board.items || []) {
        if (item.kind !== "portal" || item.portalCompact) continue;
        const width = Number(item.width || targetWidth);
        const height = Number(item.height || targetHeight);
        const ratio = Math.min(1, targetWidth / Math.max(1, width), targetHeight / Math.max(1, height));
        if (ratio < 1) {
          const centerX = Number(item.x) + width / 2;
          const centerY = Number(item.y) + height / 2;
          item.width = Math.max(80, Math.round(width * ratio));
          item.height = Math.max(30, Math.round(height * ratio));
          item.x = Math.round(centerX - item.width / 2);
          item.y = Math.round(centerY - item.height / 2);
          changed = true;
        }
        item.portalCompact = true;
      }
      return changed;
    }

    function boardCropStyle(item) {
      const crop = item.crop || {};
      return `inset(${Number(crop.top || 0)}% ${Number(crop.right || 0)}% ${Number(crop.bottom || 0)}% ${Number(crop.left || 0)}%)`;
    }

    function selectionHandles(showControls = true) {
      return `
        <div class="selection-outline"></div>
        ${showControls ? `
          <div class="resize-handle corner" data-resize="both" title="${t("resizeBoth")}"></div>
          <div class="resize-handle edge-bottom" data-resize="height" title="${t("resizeHeight")}"></div>
          <div class="resize-handle edge-right" data-resize="width" title="${t("resizeWidth")}"></div>
          <div class="rotate-handle" data-rotate title="${t("rotateHandle")}">${icon("rotate")}</div>` : ""}`;
    }

    function refreshSelectionDom() {
      const world = document.getElementById("canvas-world");
      if (!world) return;
      world.querySelectorAll(".board-item").forEach((node) => {
        const selected = state.selectedIds.has(node.dataset.itemId);
        node.classList.toggle("selected", selected);
        node.querySelectorAll(".selection-outline,.resize-handle,.rotate-handle").forEach((control) => control.remove());
        if (selected) {
          node.insertAdjacentHTML("beforeend", selectionHandles(node.dataset.itemId === state.selectedId));
        }
      });
    }

    function renderShell() {
      document.title = `${board.name} — MegaBox`;
      app.innerHTML = `
        <div class="viewer-shell board-shell ${state.leftCollapsed ? "left-collapsed" : ""} ${state.rightCollapsed ? "right-collapsed" : ""} ${state.toolbarsCollapsed ? "toolbars-collapsed" : ""}">
          <aside class="board-assets">
            <div class="board-assets-head">
              <strong>${t("boardAssets")}</strong>
              <label class="mini-search">${icon("search")}<input type="search" placeholder="${t("searchImagesFolders")}" id="board-asset-search" /></label>
            </div>
            <div class="board-folder-tree" id="mini-assets"></div>
            <div class="board-assets-foot">
              <button class="button" data-action="import-assets">${icon("upload")}${t("importNewAssets")}</button>
            </div>
          </aside>
          <main class="viewer-main">
            <header class="viewer-bar">
              <button class="icon-button board-panel-toggle ${state.leftCollapsed ? "active" : ""}" data-toggle-board-left title="${state.leftCollapsed ? t("showAssetsPanel") : t("hideAssetsPanel")}">${icon("panelLeft")}</button>
              <div class="viewer-title"><strong id="board-title-label">${escapeHtml(board.name)}</strong><span>${t("boardWorkspace")}</span></div>
              <div class="bar-divider"></div>
              <div class="save-state" id="board-save-state">${t("saved")}</div>
              <div class="toolbar-spacer"></div>
              <button class="icon-button board-panel-toggle ${state.rightCollapsed ? "active" : ""}" data-toggle-board-right title="${state.rightCollapsed ? t("showPropertiesPanel") : t("hidePropertiesPanel")}">${icon("panelRight")}</button>
              <button class="icon-button" data-action="fit-board" title="${t("fitAllContent")}">${icon("fit")}</button>
              <button class="icon-button" data-action="save" title="${t("saveNow")}">${icon("open")}</button>
              <button class="icon-button ${state.toolbarsCollapsed ? "active" : ""}" data-toggle-all-toolbars title="${state.toolbarsCollapsed ? t("showAllTools") : t("hideAllTools")}">${icon("collapseTools")}</button>
            </header>
            <div class="canvas-toolbar">
              <button class="tool-button active" title="${t("toolSelect")}">⌖</button>
              <button class="tool-button" data-action="add-note" title="${t("toolText")}">${icon("text")}</button>
              <button class="tool-button" data-action="add-arrow" title="${t("toolArrow")}">${icon("arrow")}</button>
              <button class="tool-button" data-action="add-portal" title="${t("toolPortal")}">${icon("portal")}</button>
              <button class="tool-button" data-action="add-frame" title="${t("toolFrame")}">${icon("frame")}</button>
              <div class="bar-divider"></div>
              <span class="zoom-readout" id="board-item-count"></span>
              <div class="toolbar-spacer"></div>
              <span class="zoom-readout">${t("canvasHelp")}</span>
            </div>
            <div class="canvas-stage" id="canvas-stage">
              <div class="canvas-world" id="canvas-world"></div>
              <div class="canvas-footer">
                <button class="icon-button" data-action="zoom-out">${icon("minus")}</button>
                <span class="zoom-readout" id="board-zoom">100%</span>
                <button class="icon-button" data-action="zoom-in">${icon("plus")}</button>
                <button class="icon-button" data-action="fit-board">${icon("fit")}</button>
              </div>
              <button class="icon-button immersive-restore ${state.toolbarsCollapsed ? "active" : ""}"
                      data-toggle-all-toolbars
                      title="${state.toolbarsCollapsed ? t("showAllTools") : t("hideAllTools")}">${icon("collapseTools")}</button>
            </div>
          </main>
          <aside class="inspector">
            <div class="inspector-head"><strong>${t("properties")}</strong><span id="selection-label">${t("canvas")}</span></div>
            <div class="inspector-body" id="board-inspector"></div>
          </aside>
        </div>`;
      bindShellEvents();
      renderMiniAssets();
      const portalsNormalized = normalizeLegacyPortals();
      renderWorld();
      renderInspector();
      applyViewport();
      updateZoomReadout();
      const viewport = board.viewport || {};
      const isInitialViewport =
        Number(viewport.x || 0) === 0 &&
        Number(viewport.y || 0) === 0 &&
        Number(viewport.zoom || 1) === 1;
      if ((board.items || []).length && isInitialViewport) {
        requestAnimationFrame(fitBoard);
      }
      if (portalsNormalized) scheduleSave();
    }

    function renderMiniAssets() {
      const container = document.getElementById("mini-assets");
      const query = state.assetQuery.trim().toLowerCase();
      const saveExpanded = () =>
        localStorage.setItem("megabox.boardExpandedFolders", JSON.stringify([...state.expandedFolders]));
      const childFolders = (parentId) =>
        boardFolders.filter((folder) => (folder.parentId || "") === (parentId || ""));
      const directAssets = (folderId) =>
        [...assetsById.values()].filter((asset) => (asset.folderId || "") === folderId);
      const folderPath = (folderId) => {
        const names = [];
        let cursor = folderId;
        let guard = 0;
        while (cursor && guard++ < 20) {
          const folder = boardFolders.find((item) => item.id === cursor);
          if (!folder) break;
          names.unshift(folder.name);
          cursor = folder.parentId || "";
        }
        return names.join(" / ");
      };
      const imageRow = (asset, depth) => `
        <div class="nav-item tree-asset-row board-tree-asset"
             draggable="true"
             data-board-asset-id="${escapeHtml(asset.id)}"
             data-asset-preview-id="${escapeHtml(asset.id)}"
             style="--tree-depth:${Math.min(depth, 2)}"
             title="${escapeHtml(asset.name)}">
          <span class="tree-asset-guide"></span>
          <span class="tree-asset-icon">${icon("image")}</span>
          <span class="folder-row-name">${escapeHtml(compactName(asset.name))}</span>
          ${query ? `<span class="board-search-path">${escapeHtml(folderPath(asset.folderId) || t("uncategorized"))}</span>` : ""}
        </div>`;
      const folderBranch = (parentId = "", depth = 0) => {
        return childFolders(parentId).map((folder) => {
          const children = childFolders(folder.id);
          const images = directAssets(folder.id);
          const hasChildren = children.length > 0 || images.length > 0;
          const expanded = hasChildren && state.expandedFolders.has(folder.id);
          return `
            <div class="nav-item folder-row board-folder-row"
                 data-board-folder-id="${escapeHtml(folder.id)}"
                 style="--folder-depth:${Math.min(depth, 2)}">
              <button class="folder-toggle ${hasChildren ? "" : "empty"} ${expanded ? "expanded" : ""}"
                      type="button"
                      ${hasChildren ? `data-board-folder-toggle="${escapeHtml(folder.id)}"` : 'tabindex="-1"'}></button>
              <span class="folder-tree-icon">${icon(expanded ? "folderOpen" : "folder")}</span>
              <span class="folder-row-name">${escapeHtml(folder.name)}</span>
              <span class="nav-count">${images.length}</span>
            </div>
            ${expanded
              ? `${folderBranch(folder.id, depth + 1)}${images.map((asset) => imageRow(asset, depth + 1)).join("")}`
              : ""}`;
        }).join("");
      };

      if (query) {
        const matches = [...assetsById.values()].filter((asset) => {
          const path = folderPath(asset.folderId);
          return `${asset.name} ${(asset.tags || []).join(" ")} ${path}`.toLowerCase().includes(query);
        });
        container.innerHTML = matches.length
          ? matches.map((asset) => imageRow(asset, 0)).join("")
          : `<div class="muted-box">${t("noMatchingImages")}</div>`;
      } else {
        const unfiled = directAssets("");
        const unfiledExpanded = state.expandedFolders.has("__unfiled");
        container.innerHTML = `
          ${folderBranch()}
          <div class="nav-item folder-row board-folder-row folder-unfiled" data-board-unfiled>
            <button class="folder-toggle ${unfiled.length ? "" : "empty"} ${unfiledExpanded ? "expanded" : ""}"
                    type="button"
                    ${unfiled.length ? "data-board-unfiled-toggle" : 'tabindex="-1"'}></button>
            <span class="folder-tree-icon">${icon(unfiledExpanded ? "folderOpen" : "folder")}</span>
            <span class="folder-row-name">${t("uncategorized")}</span>
            <span class="nav-count">${unfiled.length}</span>
          </div>
          ${unfiledExpanded ? unfiled.map((asset) => imageRow(asset, 1)).join("") : ""}
          ${!boardFolders.length && !unfiled.length ? `<div class="muted-box">${t("noImagesImport")}</div>` : ""}`;
      }

      container.querySelectorAll("[data-board-folder-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const id = button.dataset.boardFolderToggle;
          if (state.expandedFolders.has(id)) state.expandedFolders.delete(id);
          else state.expandedFolders.add(id);
          saveExpanded();
          renderMiniAssets();
        });
      });
      container.querySelector("[data-board-unfiled-toggle]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.expandedFolders.has("__unfiled")) state.expandedFolders.delete("__unfiled");
        else state.expandedFolders.add("__unfiled");
        saveExpanded();
        renderMiniAssets();
      });
      container.querySelectorAll("[data-board-asset-id]").forEach((node) => {
        const assetId = node.dataset.boardAssetId;
        node.addEventListener("dragstart", (event) => {
          internalDragActive = true;
          document.getElementById("drop-overlay").hidden = true;
          event.dataTransfer.setData("application/x-megabox-asset", assetId);
          event.dataTransfer.effectAllowed = "copy";
        });
        node.addEventListener("dragend", () => {
          internalDragActive = false;
          document.getElementById("drop-overlay").hidden = true;
        });
        node.addEventListener("dblclick", () => addAsset(assetId));
      });
    }

    function renderWorld() {
      const world = document.getElementById("canvas-world");
      if (!world) return;
      const items = [...(state.board.items || [])].sort((a, b) => Number(a.z || 0) - Number(b.z || 0));
      world.innerHTML = items
        .map((item) => {
          const selected = state.selectedIds.has(item.id);
          const primary = item.id === state.selectedId;
          const commonStyle = `left:${Number(item.x)}px;top:${Number(item.y)}px;width:${Number(item.width)}px;height:${Number(item.height)}px;transform:rotate(${Number(item.rotation || 0)}deg);opacity:${Number(item.opacity ?? 1)};z-index:${Number(item.z || 1)}`;
          if (item.kind === "image") {
            const asset = assetFor(item);
            return `<div class="board-item image ${selected ? "selected" : ""}" data-item-id="${item.id}" style="${commonStyle}">
              <div class="item-content"><img src="${asset ? assetUrl(asset) : ""}" alt="" draggable="false" style="clip-path:${boardCropStyle(item)}" /></div>
              ${selected ? selectionHandles(primary) : ""}
            </div>`;
          }
          if (item.kind === "note") {
            const backgroundColor = colorWithAlpha(item.color || "#f3b55f", item.backgroundOpacity ?? 1);
            const textColor = colorWithAlpha(item.textColor || "#21180b", item.textOpacity ?? 1);
            return `<div class="board-item note ${selected ? "selected" : ""}" data-item-id="${item.id}" style="${commonStyle}">
              <div class="item-content" style="background:${backgroundColor};color:${textColor};font-size:${Number(item.fontSize || 14)}px">${escapeHtml(item.text || "文字标注")}</div>
              ${selected ? selectionHandles(primary) : ""}
            </div>`;
          }
          if (item.kind === "arrow") {
            const width = Number(item.width || 240);
            const height = Number(item.height || 40);
            const arrowColor = colorWithAlpha(item.color || "#f3ad5c", item.colorOpacity ?? 1);
            const strokeWidth = Number(item.strokeWidth || 3);
            const centerY = height / 2;
            const tipX = width - 5;
            const headLength = Math.max(10, strokeWidth * 3);
            const headHalfHeight = Math.max(5, strokeWidth * 1.8);
            const baseX = Math.max(8, tipX - headLength);
            return `<div class="board-item arrow ${selected ? "selected" : ""}" data-item-id="${item.id}" style="${commonStyle}">
              <div class="item-content">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
                  <path d="M4 ${centerY} L${baseX} ${centerY}" fill="none" stroke="${arrowColor}" stroke-width="${strokeWidth}" stroke-linecap="round"></path>
                  <path d="M${baseX} ${centerY - headHalfHeight} L${tipX} ${centerY} L${baseX} ${centerY + headHalfHeight} Z" fill="${arrowColor}"></path>
                </svg>
              </div>
              ${selected ? selectionHandles(primary) : ""}
            </div>`;
          }
          if (item.kind === "portal") {
            const portalName = item.name || t("portal");
            return `<div class="board-item portal ${selected ? "selected" : ""}" data-item-id="${item.id}" style="${commonStyle}">
              <div class="item-content portal-content" style="font-size:${Math.max(11, Number(item.height || 40) * 0.28)}px">
                <span class="portal-orb">${icon("portal")}</span>
                <strong class="portal-name">${escapeHtml(portalName)}</strong>
              </div>
              ${selected ? selectionHandles(primary) : ""}
            </div>`;
          }
          if (item.kind === "frame") {
            const borderColor = colorWithAlpha(item.borderColor || "#8b7cff", item.borderOpacity ?? 1);
            const backgroundColor = colorWithAlpha(item.backgroundColor || "#3d335c", item.backgroundOpacity ?? 0.25);
            return `<div class="board-item frame ${selected ? "selected" : ""}" data-item-id="${item.id}" style="${commonStyle}">
              <div class="item-content frame-content"
                   style="border-width:${Number(item.borderWidth ?? 2)}px;border-color:${borderColor};background:${backgroundColor}"></div>
              ${selected ? selectionHandles(primary) : ""}
            </div>`;
          }
          return "";
        })
        .join("");

      if (!items.length) {
        world.innerHTML = `<div class="board-hint">${icon("board")}<strong>${t("emptyBoardTitle")}</strong><span>${t("emptyBoardHint")}</span></div>`;
      }

      const count = document.getElementById("board-item-count");
      if (count) count.textContent = `${items.length} ${t("objects")}`;
      bindItemEvents();
    }

    function pairedField(label, value, options) {
      const {
        prop = "",
        cropKey = "",
        min,
        max,
        step = 1,
        numberMin = min,
        numberMax = max,
        numberStep = step,
        numberScale = 1,
        scrub = false
      } = options;
      const attribute = prop
        ? `data-item-prop="${prop}"`
        : `data-item-crop="${cropKey}"`;
      const rangeControl = scrub
        ? `<div class="paired-slider scrub-slider"
             data-scrub-prop="${prop}"
             data-scrub-step="${numberStep}"
             role="slider"
             tabindex="0"
             aria-label="${label}"
             aria-valuenow="${Number(value)}"
             title="${t("scaleHint")}">
             <span class="scrub-minus">−</span>
             <span class="scrub-thumb"></span>
             <span class="scrub-plus">+</span>
           </div>`
        : `<input class="paired-slider" type="range"
             ${attribute}
             data-value-scale="1"
             min="${min}" max="${max}" step="${step}"
             value="${Number(value)}" />`;
      return `
        <div class="field paired-field">
          <label ${prop ? `data-value-label="${prop}"` : ""}>${label}</label>
          <input class="paired-number" type="number"
            ${attribute}
            data-value-scale="${numberScale}"
            ${Number.isFinite(numberMin) ? `min="${numberMin}"` : ""}
            ${Number.isFinite(numberMax) ? `max="${numberMax}"` : ""}
            step="${numberStep}"
            value="${Number(value) * numberScale}" />
          ${rangeControl}
        </div>`;
    }

    function renderInspector() {
      const inspector = document.getElementById("board-inspector");
      const label = document.getElementById("selection-label");
      const item = getSelected();
      if (!item) {
        label.textContent = t("canvas");
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("canvasInfo")}</span></div>
            <div class="field"><label>${t("boardName")}</label><input data-board-field="name" value="${escapeHtml(board.name)}" /></div>
            <div class="property-row" style="margin-top:8px">
              <div class="field"><label>${t("objectCount")}</label><input value="${(board.items || []).length}" readonly /></div>
              <div class="field"><label>${t("updatedAt")}</label><input value="${formatDate(board.updatedAt)}" readonly /></div>
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("boardBackground")}</span></div>
            <div class="field"><input type="color" data-board-field="background" value="${escapeHtml(board.background || "#11141a")}" /></div>
            <div class="tag-cloud" style="padding:9px 0 0">
              ${["#11141a", "#181512", "#101817", "#141019", "#191b1f"].map((color) => `<button class="tag-chip" data-background="${color}" style="width:27px;height:27px;padding:0;background:${color}"></button>`).join("")}
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("shortcuts")}</span></div>
            <div class="shortcut-list">
              <div class="shortcut-row"><span>${t("addText")}</span><kbd>T</kbd></div>
              <div class="shortcut-row"><span>${t("panCanvas")}</span><kbd>Space + ${t("drag")}</kbd></div>
              <div class="shortcut-row"><span>${t("zoomCanvas")}</span><kbd>${t("wheel")}</kbd></div>
              <div class="shortcut-row"><span>${t("deleteObject")}</span><kbd>Delete</kbd></div>
              <div class="shortcut-row"><span>${t("duplicateObject")}</span><kbd>Ctrl D</kbd></div>
            </div>
          </section>`;
      } else if (item.kind === "image") {
        const asset = assetFor(item);
        label.textContent = t("imageObject");
        const crop = item.crop || {};
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("material")}</span></div>
            <div class="file-facts">
              <div class="file-fact"><span>${t("boardName")}</span><b title="${escapeHtml(asset?.name || t("materialMissing"))}">${escapeHtml(compactName(asset?.name || t("materialMissing")))}</b></div>
              <div class="file-fact"><span>${t("format")}</span><b>${escapeHtml((asset?.extension || "").replace(".", "").toUpperCase())}</b></div>
              <div class="file-fact"><span>${t("fileSize")}</span><b>${formatBytes(asset?.size)}</b></div>
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("positionAndSize")}</span></div>
            <div class="property-row paired-row">
              ${pairedField("X", item.x, { prop: "x", step: 1, scrub: true })}
              ${pairedField("Y", item.y, { prop: "y", step: 1, scrub: true })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("width"), item.width, { prop: "width", min: 24, step: 1, scrub: true })}
              ${pairedField(t("height"), item.height, { prop: "height", min: 24, step: 1, scrub: true })}
            </div>
            <div class="field paired-field image-scale-field">
              <label data-image-scale-label>${t("proportionalScale")} ${Math.round((Number(item.width) / Math.max(1, Number(asset?.width || item.width))) * 100)}%</label>
              <input class="paired-number" type="number"
                     min="1" step="1"
                     data-image-scale
                     data-base-width="${Math.max(1, Number(asset?.width || item.width))}"
                     data-base-height="${Math.max(1, Number(asset?.height || item.height))}"
                     value="${Math.round((Number(item.width) / Math.max(1, Number(asset?.width || item.width))) * 1000) / 10}" />
              <div class="paired-slider scrub-slider"
                   data-image-scale-scrub
                   data-scrub-step="1"
                   role="slider"
                   tabindex="0"
                   title="${t("originalScaleHint")}">
                <span class="scrub-minus">−</span>
                <span class="scrub-thumb"></span>
                <span class="scrub-plus">+</span>
              </div>
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("rotation"), Number(item.rotation || 0), { prop: "rotation", min: -180, max: 180 })}
              ${pairedField(`${t("opacity")} ${Math.round(Number(item.opacity ?? 1) * 100)}%`, Number(item.opacity ?? 1), {
                prop: "opacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberStep: 1,
                numberScale: 100
              })}
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("canvasCrop")}</span><button data-crop-reset>${t("reset")}</button></div>
            <div class="property-row paired-row">
              ${pairedField(t("leftPercent"), Number(crop.left || 0), { cropKey: "left", min: 0, max: 90 })}
              ${pairedField(t("topPercent"), Number(crop.top || 0), { cropKey: "top", min: 0, max: 90 })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("rightPercent"), Number(crop.right || 0), { cropKey: "right", min: 0, max: 90 })}
              ${pairedField(t("bottomPercent"), Number(crop.bottom || 0), { cropKey: "bottom", min: 0, max: 90 })}
            </div>
          </section>
          ${itemActions()}`;
      } else if (item.kind === "note") {
        label.textContent = t("textAnnotation");
        const backgroundOpacity = Number(item.backgroundOpacity ?? 1);
        const textOpacity = Number(item.textOpacity ?? 1);
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("positionAndSize")}</span></div>
            <div class="property-row paired-row">
              ${pairedField("X", item.x, { prop: "x", step: 1, scrub: true })}
              ${pairedField("Y", item.y, { prop: "y", step: 1, scrub: true })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("width"), item.width, { prop: "width", min: 24, step: 1, scrub: true })}
              ${pairedField(t("height"), item.height, { prop: "height", min: 24, step: 1, scrub: true })}
            </div>
            <div class="field paired-field image-scale-field">
              <label data-text-scale-label>${t("proportionalScale")} 100%</label>
              <input class="paired-number" type="number"
                     min="1" step="1"
                     data-text-scale
                     data-base-width="${Math.max(1, Number(item.width))}"
                     data-base-height="${Math.max(1, Number(item.height))}"
                     value="100" />
              <div class="paired-slider scrub-slider"
                   data-text-scale-scrub
                   data-scrub-step="1"
                   role="slider"
                   tabindex="0"
                   title="${t("proportionalScaleHint")}">
                <span class="scrub-minus">−</span>
                <span class="scrub-thumb"></span>
                <span class="scrub-plus">+</span>
              </div>
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("content")}</span></div>
            <div class="field"><textarea data-item-prop="text">${escapeHtml(item.text || "")}</textarea></div>
            <div class="property-row" style="margin-top:8px">
              <div class="field"><label>${t("background")}</label><input type="color" data-item-prop="color" value="${escapeHtml(item.color || "#f3b55f")}" /></div>
              <div class="field"><label>${t("textColor")}</label><input type="color" data-item-prop="textColor" value="${escapeHtml(item.textColor || "#21180b")}" /></div>
            </div>
            <div class="property-row paired-row">
              ${pairedField(`${t("backgroundOpacity")} ${Math.round(backgroundOpacity * 100)}%`, backgroundOpacity, {
                prop: "backgroundOpacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberScale: 100
              })}
              ${pairedField(`${t("textOpacity")} ${Math.round(textOpacity * 100)}%`, textOpacity, {
                prop: "textOpacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberScale: 100
              })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("fontSize"), Number(item.fontSize || 14), {
                prop: "fontSize",
                min: 8,
                step: 1,
                scrub: true
              })}
              ${pairedField(t("rotation"), Number(item.rotation || 0), {
                prop: "rotation",
                min: -180,
                max: 180
              })}
            </div>
          </section>
          ${itemActions()}`;
      } else if (item.kind === "arrow") {
        label.textContent = t("arrowAnnotation");
        const colorOpacity = Number(item.colorOpacity ?? 1);
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("arrowAnnotation")}</span></div>
            <div class="property-row">
              <div class="field"><label>${t("color")}</label><input type="color" data-item-prop="color" value="${escapeHtml(item.color || "#f3ad5c")}" /></div>
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("length"), Number(item.width), {
                prop: "width",
                min: 20,
                step: 1,
                scrub: true
              })}
              ${pairedField(t("lineWidth"), Number(item.strokeWidth || 3), {
                prop: "strokeWidth",
                min: 1,
                step: 1,
                scrub: true
              })}
              ${pairedField(`${t("colorOpacity")} ${Math.round(colorOpacity * 100)}%`, colorOpacity, {
                prop: "colorOpacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberScale: 100
              })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("rotation"), Number(item.rotation || 0), {
                prop: "rotation",
                min: -180,
                max: 180
              })}
            </div>
          </section>
          ${itemActions()}`;
      } else if (item.kind === "portal") {
        const linked = (state.board.items || []).find((entry) => entry.id === item.linkId);
        const portalName = item.name || t("portal");
        label.textContent = t("portal");
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("jumpModule")}</span></div>
            <div class="field"><label>${t("portalName")}</label><input data-portal-name value="${escapeHtml(portalName)}" /></div>
            <div class="file-facts">
              <div class="file-fact"><span>${t("current")}</span><b>${escapeHtml(portalName)}</b></div>
              <div class="file-fact"><span>${t("target")}</span><b>${linked ? t("samePairPortal") : t("pairedPortalMissing")}</b></div>
            </div>
            <button class="button primary" data-portal-focus style="width:100%;margin-top:9px" ${linked ? "" : "disabled"}>
              ${icon("portal")}${t("jumpToOtherPortal")}
            </button>
            <div class="muted-box" style="margin-top:8px">${t("portalDoubleClickHint")}</div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("positionAndSize")}</span></div>
            <div class="property-row paired-row">
              ${pairedField("X", item.x, { prop: "x", step: 1, scrub: true })}
              ${pairedField("Y", item.y, { prop: "y", step: 1, scrub: true })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("width"), item.width, { prop: "width", min: 80, step: 1, scrub: true })}
              ${pairedField(t("height"), item.height, { prop: "height", min: 40, step: 1, scrub: true })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("rotation"), Number(item.rotation || 0), { prop: "rotation", min: -180, max: 180 })}
            </div>
          </section>
          ${itemActions()}`;
      } else if (item.kind === "frame") {
        label.textContent = t("frameBoard");
        const borderOpacity = Number(item.borderOpacity ?? 1);
        const backgroundOpacity = Number(item.backgroundOpacity ?? 0.25);
        inspector.innerHTML = `
          <section class="property-section">
            <div class="property-title"><span>${t("frameSize")}</span></div>
            <div class="property-row paired-row">
              ${pairedField(t("length"), item.width, { prop: "width", min: 24, step: 1, scrub: true })}
              ${pairedField(t("frameWidth"), item.height, { prop: "height", min: 24, step: 1, scrub: true })}
            </div>
            <div class="field paired-field image-scale-field">
              <label data-frame-scale-label>${t("proportionalScale")} 100%</label>
              <input class="paired-number" type="number"
                     min="1" step="1"
                     data-frame-scale
                     data-base-width="${Math.max(1, Number(item.width))}"
                     data-base-height="${Math.max(1, Number(item.height))}"
                     value="100" />
              <div class="paired-slider scrub-slider"
                   data-frame-scale-scrub
                   data-scrub-step="1"
                   role="slider"
                   tabindex="0"
                   title="${t("proportionalScaleHint")}">
                <span class="scrub-minus">−</span>
                <span class="scrub-thumb"></span>
                <span class="scrub-plus">+</span>
              </div>
            </div>
            <div class="property-row paired-row">
              ${pairedField("X", item.x, { prop: "x", step: 1, scrub: true })}
              ${pairedField("Y", item.y, { prop: "y", step: 1, scrub: true })}
            </div>
            <div class="property-row paired-row">
              ${pairedField(t("rotation"), Number(item.rotation || 0), { prop: "rotation", min: -180, max: 180 })}
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("border")}</span></div>
            <div class="property-row paired-row">
              ${pairedField(t("borderWidth"), Number(item.borderWidth ?? 2), {
                prop: "borderWidth",
                min: 0,
                step: 1,
                scrub: true
              })}
              <div class="field"><label>${t("borderColor")}</label><input type="color" data-item-prop="borderColor" value="${escapeHtml(item.borderColor || "#8b7cff")}" /></div>
            </div>
            <div class="property-row paired-row">
              ${pairedField(`${t("borderOpacity")} ${Math.round(borderOpacity * 100)}%`, borderOpacity, {
                prop: "borderOpacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberScale: 100
              })}
            </div>
          </section>
          <section class="property-section">
            <div class="property-title"><span>${t("background")}</span></div>
            <div class="property-row">
              <div class="field"><label>${t("backgroundColor")}</label><input type="color" data-item-prop="backgroundColor" value="${escapeHtml(item.backgroundColor || "#3d335c")}" /></div>
            </div>
            <div class="property-row paired-row">
              ${pairedField(`${t("backgroundOpacity")} ${Math.round(backgroundOpacity * 100)}%`, backgroundOpacity, {
                prop: "backgroundOpacity",
                min: 0,
                max: 1,
                step: 0.01,
                numberMin: 0,
                numberMax: 100,
                numberScale: 100
              })}
            </div>
          </section>
          ${itemActions()}`;
      }
      bindInspectorEvents();
    }

    function itemActions() {
      const isFrame = getSelected()?.kind === "frame";
      return `
        <section class="property-section">
          <div class="property-title"><span>${t("actions")}</span></div>
          <div class="property-row">
            <button class="button" data-item-action="duplicate">${t("duplicate")}</button>
            <button class="button" data-item-action="${isFrame ? "back" : "front"}">${isFrame ? t("moveToBottom") : t("bringToFront")}</button>
          </div>
          <button class="button danger" data-item-action="delete" style="width:100%;margin-top:8px">${icon("trash")}${t("deleteObject")}</button>
        </section>`;
    }

    function scheduleSave() {
      state.dirty = true;
      const status = document.getElementById("board-save-state");
      if (status) {
        status.textContent = t("saving");
        status.classList.add("dirty");
      }
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(saveNow, 420);
    }

    async function saveNow() {
      clearTimeout(state.saveTimer);
      state.board.viewport = { x: state.panX, y: state.panY, zoom: state.zoom };
      try {
        const result = await invoke("board.save", { board: state.board });
        state.board.updatedAt = result.updatedAt;
        state.dirty = false;
        const status = document.getElementById("board-save-state");
        if (status) {
          status.textContent = t("saved");
          status.classList.remove("dirty");
        }
      } catch (error) {
        toast(error.message, "error");
      }
    }

    function applyViewport() {
      const world = document.getElementById("canvas-world");
      if (world) {
        world.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
        world.style.setProperty("--inverse-zoom", String(1 / state.zoom));
      }
      updateZoomReadout();
    }

    function updateZoomReadout() {
      const readout = document.getElementById("board-zoom");
      if (readout) readout.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    function toggleBoardPanel(side) {
      const key = side === "left" ? "leftCollapsed" : "rightCollapsed";
      state[key] = !state[key];
      state.toolbarsCollapsed = false;
      const shell = document.querySelector(".board-shell");
      shell?.classList.toggle(`${side}-collapsed`, state[key]);
      shell?.classList.remove("toolbars-collapsed");
      const button = document.querySelector(`[data-toggle-board-${side}]`);
      if (button) {
        button.classList.toggle("active", state[key]);
        button.title = side === "left"
          ? (state[key] ? t("showAssetsPanel") : t("hideAssetsPanel"))
          : (state[key] ? t("showPropertiesPanel") : t("hidePropertiesPanel"));
      }
      document.querySelectorAll("[data-toggle-all-toolbars]").forEach((button) => {
        button.classList.remove("active");
        button.title = t("hideAllTools");
      });
      localStorage.setItem("megabox.boardPanelState", JSON.stringify({
        leftCollapsed: state.leftCollapsed,
        rightCollapsed: state.rightCollapsed,
        toolbarsCollapsed: state.toolbarsCollapsed
      }));
    }

    function toggleAllToolbars() {
      state.toolbarsCollapsed = !state.toolbarsCollapsed;
      state.leftCollapsed = state.toolbarsCollapsed;
      state.rightCollapsed = state.toolbarsCollapsed;
      const shell = document.querySelector(".board-shell");
      shell?.classList.toggle("toolbars-collapsed", state.toolbarsCollapsed);
      shell?.classList.toggle("left-collapsed", state.leftCollapsed);
      shell?.classList.toggle("right-collapsed", state.rightCollapsed);
      document.querySelector("[data-toggle-board-left]")?.classList.toggle("active", state.leftCollapsed);
      document.querySelector("[data-toggle-board-right]")?.classList.toggle("active", state.rightCollapsed);
      document.querySelectorAll("[data-toggle-all-toolbars]").forEach((button) => {
        button.classList.toggle("active", state.toolbarsCollapsed);
        button.title = state.toolbarsCollapsed ? t("showAllTools") : t("hideAllTools");
      });
      localStorage.setItem("megabox.boardPanelState", JSON.stringify({
        leftCollapsed: state.leftCollapsed,
        rightCollapsed: state.rightCollapsed,
        toolbarsCollapsed: state.toolbarsCollapsed
      }));
    }

    function screenToWorld(clientX, clientY) {
      const rect = document.getElementById("canvas-stage").getBoundingClientRect();
      return {
        x: (clientX - rect.left - state.panX) / state.zoom,
        y: (clientY - rect.top - state.panY) / state.zoom
      };
    }

    function getNaturalSize(asset) {
      const width = Number(asset?.width || 0);
      const height = Number(asset?.height || 0);
      if (width > 0 && height > 0) {
        return Promise.resolve({ width, height });
      }
      if (naturalSizeCache.has(asset?.id)) {
        return Promise.resolve(naturalSizeCache.get(asset.id));
      }

      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const size = {
            width: image.naturalWidth || 800,
            height: image.naturalHeight || 600
          };
          if (asset?.id) naturalSizeCache.set(asset.id, size);
          resolve(size);
        };
        image.onerror = () => resolve({ width: 800, height: 600 });
        image.src = assetUrl(asset);
      });
    }

    async function addAsset(assetId, worldPoint) {
      const asset = assetsById.get(assetId);
      if (!asset) return;
      const dimensions = await getNaturalSize(asset);
      const stage = document.getElementById("canvas-stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const point = worldPoint || screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const item = {
        id: uid(),
        kind: "image",
        assetId,
        x: Math.round(point.x - dimensions.width / 2),
        y: Math.round(point.y - dimensions.height / 2),
        width: dimensions.width,
        height: dimensions.height,
        rotation: 0,
        opacity: 1,
        z: Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1,
        crop: { left: 0, top: 0, right: 0, bottom: 0 }
      };
      state.board.items = [...(state.board.items || []), item];
      selectOnly(item.id);
      renderWorld();
      renderInspector();
      scheduleSave();
    }

    function addNote() {
      const stage = document.getElementById("canvas-stage");
      const rect = stage.getBoundingClientRect();
      const point = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const item = {
        id: uid(),
        kind: "note",
        x: Math.round(point.x - 105),
        y: Math.round(point.y - 42),
        width: 210,
        height: 84,
        rotation: 0,
        opacity: 1,
        z: Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1,
        text: t("defaultBoardNote"),
        color: "#f3b55f",
        textColor: "#21180b",
        backgroundOpacity: 1,
        textOpacity: 1,
        fontSize: 14
      };
      state.board.items = [...(state.board.items || []), item];
      selectOnly(item.id);
      renderWorld();
      renderInspector();
      scheduleSave();
    }

    function addArrow() {
      const stage = document.getElementById("canvas-stage");
      const rect = stage.getBoundingClientRect();
      const point = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const item = {
        id: uid(),
        kind: "arrow",
        x: Math.round(point.x - 120),
        y: Math.round(point.y - 18),
        width: 240,
        height: 36,
        rotation: 0,
        opacity: 1,
        z: Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1,
        color: "#f3ad5c",
        colorOpacity: 1,
        strokeWidth: 3
      };
      state.board.items = [...(state.board.items || []), item];
      selectOnly(item.id);
      renderWorld();
      renderInspector();
      scheduleSave();
    }

    function addPortalPair() {
      const stage = document.getElementById("canvas-stage");
      const rect = stage.getBoundingClientRect();
      const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const width = Math.round(Math.max(112, Math.min(1000, 112 / state.zoom)));
      const height = Math.round(Math.max(40, Math.min(300, 40 / state.zoom)));
      const screenOffset = Math.min(270, rect.width * 0.27);
      const worldOffset = screenOffset / state.zoom;
      const firstId = uid();
      const secondId = uid();
      const portalCount = (state.board.items || []).filter((entry) => entry.kind === "portal").length;
      const portalName = `${t("portal")} ${Math.floor(portalCount / 2) + 1}`;
      const topZ = Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1;
      const first = {
        id: firstId,
        kind: "portal",
        name: portalName,
        linkId: secondId,
        x: Math.round(center.x - worldOffset - width / 2),
        y: Math.round(center.y - height / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        z: topZ
      };
      const second = {
        ...first,
        id: secondId,
        linkId: firstId,
        x: Math.round(center.x + worldOffset - width / 2),
        z: topZ + 1
      };
      state.board.items = [...(state.board.items || []), first, second];
      selectOnly(first.id);
      state.pendingItemClick = null;
      renderWorld();
      renderInspector();
      scheduleSave();
      toast(t("portalPairCreated", { name: portalName }));
    }

    function addFrame() {
      const stage = document.getElementById("canvas-stage");
      const rect = stage.getBoundingClientRect();
      const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      const width = Math.round(Math.max(280, Math.min(1800, 520 / state.zoom)));
      const height = Math.round(Math.max(180, Math.min(1200, 340 / state.zoom)));
      const minimumZ = Math.min(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) - 1;
      const item = {
        id: uid(),
        kind: "frame",
        x: Math.round(center.x - width / 2),
        y: Math.round(center.y - height / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        z: minimumZ,
        borderWidth: 2,
        borderColor: "#8b7cff",
        borderOpacity: 0.75,
        backgroundColor: "#3d335c",
        backgroundOpacity: 0.25
      };
      state.board.items = [...(state.board.items || []), item];
      selectOnly(item.id);
      state.pendingItemClick = null;
      renderWorld();
      renderInspector();
      scheduleSave();
      toast(t("frameAdded"));
    }

    function focusPortalPartner(item) {
      if (!item?.linkId) return;
      const partner = (state.board.items || []).find((entry) => entry.id === item.linkId);
      if (!partner) {
        toast(t("portalPairMissing"), "error");
        return;
      }

      const stage = document.getElementById("canvas-stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      selectOnly(partner.id);
      renderWorld();
      renderInspector();
      const world = document.getElementById("canvas-world");
      world?.classList.add("focusing");
      state.panX = rect.width / 2 - (Number(partner.x) + Number(partner.width) / 2) * state.zoom;
      state.panY = rect.height / 2 - (Number(partner.y) + Number(partner.height) / 2) * state.zoom;
      void world?.offsetWidth;
      applyViewport();
      setTimeout(() => world?.classList.remove("focusing"), 320);
      scheduleSave();
    }

    function deleteSelected() {
      if (!state.selectedIds.size) return;
      const ids = new Set(state.selectedIds);
      for (const selected of (state.board.items || []).filter((item) => ids.has(item.id))) {
        if (selected.kind === "portal" && selected.linkId) ids.add(selected.linkId);
      }
      state.board.items = (state.board.items || []).filter((item) => !ids.has(item.id));
      selectOnly(null);
      renderWorld();
      renderInspector();
      scheduleSave();
    }

    function duplicateSelected() {
      const item = getSelected();
      if (!item) return;
      const copy = { ...item, id: uid(), x: item.x + 24, y: item.y + 24, z: Number(item.z || 0) + 1 };
      state.board.items.push(copy);
      selectOnly(copy.id);
      renderWorld();
      renderInspector();
      scheduleSave();
    }

    function fitBoard() {
      const items = state.board.items || [];
      const stage = document.getElementById("canvas-stage");
      const rect = stage.getBoundingClientRect();
      if (!items.length) {
        state.zoom = 1;
        state.panX = rect.width / 2;
        state.panY = rect.height / 2;
      } else {
        const minX = Math.min(...items.map((item) => Number(item.x)));
        const minY = Math.min(...items.map((item) => Number(item.y)));
        const maxX = Math.max(...items.map((item) => Number(item.x) + Number(item.width)));
        const maxY = Math.max(...items.map((item) => Number(item.y) + Number(item.height)));
        const padding = 90;
        state.zoom = Math.max(0.1, Math.min(1.5, Math.min((rect.width - padding * 2) / (maxX - minX), (rect.height - padding * 2) / (maxY - minY))));
        state.panX = (rect.width - (maxX - minX) * state.zoom) / 2 - minX * state.zoom;
        state.panY = (rect.height - (maxY - minY) * state.zoom) / 2 - minY * state.zoom;
      }
      applyViewport();
      scheduleSave();
    }

    function focusItem(item) {
      const stage = document.getElementById("canvas-stage");
      if (!stage || !item) return;
      const rect = stage.getBoundingClientRect();
      const rotation = (Number(item.rotation || 0) * Math.PI) / 180;
      const width = Number(item.width || 0);
      const height = Number(item.height || 0);
      const boundsWidth = Math.max(1, Math.abs(width * Math.cos(rotation)) + Math.abs(height * Math.sin(rotation)));
      const boundsHeight = Math.max(1, Math.abs(width * Math.sin(rotation)) + Math.abs(height * Math.cos(rotation)));
      const padding = 80;
      const nextZoom = Math.max(
        0.08,
        Math.min(6, (rect.width - padding * 2) / boundsWidth, (rect.height - padding * 2) / boundsHeight)
      );

      const topZ = Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1;
      if (item.kind !== "frame") item.z = topZ;
      selectOnly(item.id);
      renderWorld();
      renderInspector();
      const world = document.getElementById("canvas-world");
      world?.classList.add("focusing");
      state.zoom = nextZoom;
      state.panX = rect.width / 2 - (Number(item.x) + width / 2) * nextZoom;
      state.panY = rect.height / 2 - (Number(item.y) + height / 2) * nextZoom;
      void world?.offsetWidth;
      applyViewport();
      setTimeout(() => world?.classList.remove("focusing"), 320);
      scheduleSave();
    }

    function itemCenterInsideFrame(frame, item) {
      if (frame.id === item.id) return false;
      const width = Number(frame.width || 0);
      const height = Number(frame.height || 0);
      const angle = (-Number(frame.rotation || 0) * Math.PI) / 180;
      const frameCenterX = Number(frame.x) + width / 2;
      const frameCenterY = Number(frame.y) + height / 2;
      const itemCenterX = Number(item.x) + Number(item.width || 0) / 2;
      const itemCenterY = Number(item.y) + Number(item.height || 0) / 2;
      const dx = itemCenterX - frameCenterX;
      const dy = itemCenterY - frameCenterY;
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + width / 2;
      const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + height / 2;
      return localX >= 0 && localX <= width && localY >= 0 && localY <= height;
    }

    function itemWorldBounds(item) {
      const width = Number(item.width || 0);
      const height = Number(item.height || 0);
      const angle = (Number(item.rotation || 0) * Math.PI) / 180;
      const boundsWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
      const boundsHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
      const centerX = Number(item.x) + width / 2;
      const centerY = Number(item.y) + height / 2;
      return {
        left: centerX - boundsWidth / 2,
        right: centerX + boundsWidth / 2,
        top: centerY - boundsHeight / 2,
        bottom: centerY + boundsHeight / 2
      };
    }

    function bindItemEvents() {
      const world = document.getElementById("canvas-world");
      world.querySelectorAll(".board-item").forEach((element) => {
        const item = (state.board.items || []).find((entry) => entry.id === element.dataset.itemId);
        if (!item) return;
        element.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || state.spaceDown) return;
          event.stopPropagation();
          const resizeHandle = event.target.closest("[data-resize]");
          const resizeMode = resizeHandle?.dataset.resize || "";
          const rotateHandle = event.target.closest("[data-rotate]");
          const resizing = Boolean(resizeMode);
          const rotating = Boolean(rotateHandle);
          const additive = event.ctrlKey || event.metaKey;
          if (additive && !resizing && !rotating) {
            if (state.selectedIds.has(item.id)) {
              state.selectedIds.delete(item.id);
              if (state.selectedId === item.id) {
                state.selectedId = [...state.selectedIds].at(-1) || null;
              }
              refreshSelectionDom();
              renderInspector();
              return;
            }
            state.selectedIds.add(item.id);
            state.selectedId = item.id;
          } else if (!state.selectedIds.has(item.id) || resizing || rotating) {
            selectOnly(item.id);
          } else {
            state.selectedId = item.id;
          }
          refreshSelectionDom();
          renderInspector();

          const startX = event.clientX;
          const startY = event.clientY;
          const original = {
            x: Number(item.x),
            y: Number(item.y),
            width: Number(item.width),
            height: Number(item.height),
            rotation: Number(item.rotation || 0)
          };
          const movingItems = (state.board.items || []).filter((entry) => state.selectedIds.has(entry.id));
          if (item.kind === "frame" && !resizing && !rotating) {
            for (const entry of state.board.items || []) {
              if (!movingItems.some((candidate) => candidate.id === entry.id) && itemCenterInsideFrame(item, entry)) {
                movingItems.push(entry);
              }
            }
          }
          const movingOriginals = movingItems.map((entry) => ({
            item: entry,
            x: Number(entry.x),
            y: Number(entry.y),
            element: world.querySelector(`.board-item[data-item-id="${entry.id}"]`)
          }));
          const itemRect = element.getBoundingClientRect();
          const centerX = itemRect.left + itemRect.width / 2;
          const centerY = itemRect.top + itemRect.height / 2;
          const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
          let changed = false;
          try {
            element.setPointerCapture(event.pointerId);
          } catch {
          }

          const move = (moveEvent) => {
            const dx = (moveEvent.clientX - startX) / state.zoom;
            const dy = (moveEvent.clientY - startY) / state.zoom;
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) changed = true;
            if (rotating) {
              const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
              item.rotation = Math.round((original.rotation + ((angle - startAngle) * 180) / Math.PI) * 10) / 10;
              element.style.transform = `rotate(${item.rotation}deg)`;
            } else if (resizing) {
              if (resizeMode === "height") {
                item.height = Math.max(24, Math.round(original.height + dy));
              } else if (resizeMode === "width") {
                item.width = Math.max(24, Math.round(original.width + dx));
              } else if (moveEvent.shiftKey && item.kind === "image" && original.width > 0 && original.height > 0) {
                const widthScale = (original.width + dx) / original.width;
                const heightScale = (original.height + dy) / original.height;
                const minimumScale = Math.max(24 / original.width, 24 / original.height);
                const scale = Math.max(
                  minimumScale,
                  Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale
                );
                item.width = Math.round(original.width * scale);
                item.height = Math.round(original.height * scale);
              } else {
                item.width = Math.max(24, Math.round(original.width + dx));
                item.height = Math.max(24, Math.round(original.height + dy));
              }
              element.style.width = `${item.width}px`;
              element.style.height = `${item.height}px`;
              const svg = element.querySelector("svg");
              if (svg && item.kind === "arrow") {
                svg.setAttribute("width", item.width);
                svg.setAttribute("height", item.height);
                svg.setAttribute("viewBox", `0 0 ${item.width} ${item.height}`);
                const path = svg.querySelector("path");
                path?.setAttribute("d", `M4 ${item.height / 2} L${item.width - 5} ${item.height / 2}`);
              }
            } else {
              for (const moving of movingOriginals) {
                moving.item.x = Math.round(moving.x + dx);
                moving.item.y = Math.round(moving.y + dy);
                if (moving.element) {
                  moving.element.style.left = `${moving.item.x}px`;
                  moving.element.style.top = `${moving.item.y}px`;
                }
              }
            }
          };

          const up = () => {
            element.removeEventListener("pointermove", move);
            element.removeEventListener("pointerup", up);
            if (changed) {
              state.pendingItemClick = null;
              renderWorld();
              renderInspector();
              scheduleSave();
              return;
            }
            if (!resizing && !rotating) {
              const now = performance.now();
              const previous = state.pendingItemClick;
              if (previous?.id === item.id && now - previous.time <= 420) {
                state.pendingItemClick = null;
                if (item.kind === "portal") focusPortalPartner(item);
                else focusItem(item);
              } else {
                state.pendingItemClick = { id: item.id, time: now };
              }
            }
          };
          element.addEventListener("pointermove", move);
          element.addEventListener("pointerup", up, { once: true });
        });

      });
    }

    function bindInspectorEvents() {
      const inspector = document.getElementById("board-inspector");
      inspector.querySelectorAll("[data-board-field]").forEach((input) => {
        input.addEventListener("input", () => {
          const field = input.dataset.boardField;
          if (field === "background") {
            board.background = input.value;
            document.getElementById("canvas-stage").style.backgroundColor = input.value;
          } else {
            board[field] = input.value;
            document.getElementById("board-title-label").textContent = board.name;
            document.title = `${board.name} — MegaBox`;
          }
          scheduleSave();
        });
      });

      inspector.querySelectorAll("[data-background]").forEach((button) => {
        button.addEventListener("click", () => {
          board.background = button.dataset.background;
          document.getElementById("canvas-stage").style.backgroundColor = board.background;
          renderInspector();
          scheduleSave();
        });
      });

      inspector.querySelectorAll("[data-item-prop]").forEach((input) => {
        input.addEventListener("input", () => {
          const item = getSelected();
          if (!item) return;
          const prop = input.dataset.itemProp;
          const numeric = [
            "x", "y", "width", "height", "rotation", "opacity",
            "fontSize", "strokeWidth", "backgroundOpacity", "textOpacity", "colorOpacity",
            "borderWidth", "borderOpacity"
          ].includes(prop);
          if (numeric) {
            const scale = Number(input.dataset.valueScale || 1);
            const parsed = Number(input.value);
            let value = Number.isFinite(parsed) ? parsed / scale : 0;
            if (prop === "width" || prop === "height") value = Math.max(24, value);
            if (prop === "fontSize") value = Math.max(8, value);
            if (prop === "strokeWidth") value = Math.max(1, value);
            if (prop === "borderWidth") value = Math.max(0, value);
            if (["opacity", "backgroundOpacity", "textOpacity", "colorOpacity", "borderOpacity"].includes(prop)) {
              value = Math.max(0, Math.min(1, value));
            }
            item[prop] = value;
          } else {
            item[prop] = input.value;
          }
          if (["opacity", "backgroundOpacity", "textOpacity", "colorOpacity", "borderOpacity"].includes(prop)) {
            const label = inspector.querySelector(`[data-value-label="${prop}"]`);
            const labelNames = {
              opacity: t("opacity"),
              backgroundOpacity: t("backgroundOpacity"),
              textOpacity: t("textOpacity"),
              colorOpacity: t("colorOpacity"),
              borderOpacity: t("borderOpacity")
            };
            if (label) label.textContent = `${labelNames[prop]} ${Math.round(item[prop] * 100)}%`;
          }
          if (numeric) {
            inspector.querySelectorAll(`[data-item-prop="${prop}"]`).forEach((paired) => {
              if (paired === input || !["number", "range"].includes(paired.type)) return;
              paired.value = item[prop] * Number(paired.dataset.valueScale || 1);
            });
          }
          renderWorld();
          scheduleSave();
        });
      });

      inspector.querySelectorAll("[data-scrub-prop]").forEach((slider) => {
        const prop = slider.dataset.scrubProp;
        const step = Number(slider.dataset.scrubStep || 1);
        const thumb = slider.querySelector(".scrub-thumb");
        const applyValue = (value) => {
          const item = getSelected();
          if (!item) return;
          let nextValue = Math.round(value);
          if (prop === "width" || prop === "height") nextValue = Math.max(24, nextValue);
          if (prop === "fontSize") nextValue = Math.max(8, nextValue);
          if (prop === "strokeWidth") nextValue = Math.max(1, nextValue);
          if (prop === "borderWidth") nextValue = Math.max(0, nextValue);
          item[prop] = nextValue;
          const numberInput = inspector.querySelector(`.paired-number[data-item-prop="${prop}"]`);
          if (numberInput) numberInput.value = nextValue;
          slider.setAttribute("aria-valuenow", String(nextValue));
          renderWorld();
          scheduleSave();
        };

        slider.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          const item = getSelected();
          if (!item) return;
          event.preventDefault();
          const startX = event.clientX;
          const startValue = Number(item[prop]);
          const usableWidth = Math.max(1, slider.clientWidth - 16);
          slider.classList.add("active");
          try {
            slider.setPointerCapture(event.pointerId);
          } catch {
          }

          const move = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const multiplier = moveEvent.shiftKey ? 10 : 1;
            applyValue(startValue + deltaX * step * multiplier);
            const visualDelta = Math.max(-usableWidth / 2, Math.min(usableWidth / 2, deltaX));
            const left = 50 + (visualDelta / (usableWidth / 2)) * 50;
            if (thumb) thumb.style.left = `${left}%`;
          };
          const end = () => {
            slider.removeEventListener("pointermove", move);
            slider.removeEventListener("pointerup", end);
            slider.removeEventListener("pointercancel", end);
            slider.classList.remove("active");
            if (thumb) thumb.style.left = "50%";
          };
          slider.addEventListener("pointermove", move);
          slider.addEventListener("pointerup", end, { once: true });
          slider.addEventListener("pointercancel", end, { once: true });
        });

        slider.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const item = getSelected();
          if (!item) return;
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const multiplier = event.shiftKey ? 10 : 1;
          applyValue(Number(item[prop]) + direction * step * multiplier);
        });
      });

      const scaleInput = inspector.querySelector("[data-image-scale]");
      if (scaleInput) {
        const applyImageScale = (percentage) => {
          const item = getSelected();
          if (!item || item.kind !== "image") return;
          const baseWidth = Math.max(1, Number(scaleInput.dataset.baseWidth || item.width));
          const baseHeight = Math.max(1, Number(scaleInput.dataset.baseHeight || item.height));
          const minimumScale = Math.max(24 / baseWidth, 24 / baseHeight) * 100;
          const nextScale = Math.max(minimumScale, Number(percentage) || 100);
          item.width = Math.max(24, Math.round(baseWidth * nextScale / 100));
          item.height = Math.max(24, Math.round(baseHeight * nextScale / 100));
          scaleInput.value = Math.round(nextScale * 10) / 10;
          const scaleLabel = inspector.querySelector("[data-image-scale-label]");
          if (scaleLabel) scaleLabel.textContent = `${t("proportionalScale")} ${Math.round(nextScale)}%`;
          inspector.querySelectorAll('[data-item-prop="width"],[data-item-prop="height"]').forEach((control) => {
            const prop = control.dataset.itemProp;
            control.value = item[prop] * Number(control.dataset.valueScale || 1);
          });
          renderWorld();
          scheduleSave();
        };

        scaleInput.addEventListener("input", () => applyImageScale(scaleInput.value));
        const scaleSlider = inspector.querySelector("[data-image-scale-scrub]");
        if (scaleSlider) {
          const thumb = scaleSlider.querySelector(".scrub-thumb");
          scaleSlider.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            const startX = event.clientX;
            const startScale = Number(scaleInput.value);
            const usableWidth = Math.max(1, scaleSlider.clientWidth - 16);
            scaleSlider.classList.add("active");
            try {
              scaleSlider.setPointerCapture(event.pointerId);
            } catch {
            }
            const move = (moveEvent) => {
              const delta = moveEvent.clientX - startX;
              applyImageScale(startScale + delta * (moveEvent.shiftKey ? 10 : 1));
              const visualDelta = Math.max(-usableWidth / 2, Math.min(usableWidth / 2, delta));
              if (thumb) thumb.style.left = `${50 + (visualDelta / (usableWidth / 2)) * 50}%`;
            };
            const end = () => {
              scaleSlider.removeEventListener("pointermove", move);
              scaleSlider.removeEventListener("pointerup", end);
              scaleSlider.removeEventListener("pointercancel", end);
              scaleSlider.classList.remove("active");
              if (thumb) thumb.style.left = "50%";
            };
            scaleSlider.addEventListener("pointermove", move);
            scaleSlider.addEventListener("pointerup", end, { once: true });
            scaleSlider.addEventListener("pointercancel", end, { once: true });
          });
          scaleSlider.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            applyImageScale(Number(scaleInput.value) + direction * (event.shiftKey ? 10 : 1));
          });
        }
      }

      const bindRelativeScale = (inputSelector, sliderSelector, labelSelector, kind) => {
        const input = inspector.querySelector(inputSelector);
        const slider = inspector.querySelector(sliderSelector);
        const label = inspector.querySelector(labelSelector);
        if (!input || !slider) return;
        const applyScale = (percentage) => {
          const item = getSelected();
          if (!item || item.kind !== kind) return;
          const baseWidth = Math.max(1, Number(input.dataset.baseWidth || item.width));
          const baseHeight = Math.max(1, Number(input.dataset.baseHeight || item.height));
          const minimumScale = Math.max(24 / baseWidth, 24 / baseHeight) * 100;
          const nextScale = Math.max(minimumScale, Number(percentage) || 100);
          item.width = Math.max(24, Math.round(baseWidth * nextScale / 100));
          item.height = Math.max(24, Math.round(baseHeight * nextScale / 100));
          input.value = Math.round(nextScale * 10) / 10;
          if (label) label.textContent = `${t("proportionalScale")} ${Math.round(nextScale)}%`;
          inspector.querySelectorAll('[data-item-prop="width"],[data-item-prop="height"]').forEach((control) => {
            const prop = control.dataset.itemProp;
            control.value = item[prop] * Number(control.dataset.valueScale || 1);
          });
          renderWorld();
          scheduleSave();
        };
        input.addEventListener("input", () => applyScale(input.value));
        const thumb = slider.querySelector(".scrub-thumb");
        slider.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          const startX = event.clientX;
          const startScale = Number(input.value);
          const usableWidth = Math.max(1, slider.clientWidth - 16);
          slider.classList.add("active");
          try {
            slider.setPointerCapture(event.pointerId);
          } catch {
          }
          const move = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            applyScale(startScale + delta * (moveEvent.shiftKey ? 10 : 1));
            const visualDelta = Math.max(-usableWidth / 2, Math.min(usableWidth / 2, delta));
            if (thumb) thumb.style.left = `${50 + (visualDelta / (usableWidth / 2)) * 50}%`;
          };
          const end = () => {
            slider.removeEventListener("pointermove", move);
            slider.removeEventListener("pointerup", end);
            slider.removeEventListener("pointercancel", end);
            slider.classList.remove("active");
            if (thumb) thumb.style.left = "50%";
          };
          slider.addEventListener("pointermove", move);
          slider.addEventListener("pointerup", end, { once: true });
          slider.addEventListener("pointercancel", end, { once: true });
        });
        slider.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          applyScale(Number(input.value) + direction * (event.shiftKey ? 10 : 1));
        });
      };

      bindRelativeScale("[data-text-scale]", "[data-text-scale-scrub]", "[data-text-scale-label]", "note");
      bindRelativeScale("[data-frame-scale]", "[data-frame-scale-scrub]", "[data-frame-scale-label]", "frame");

      inspector.querySelectorAll("[data-item-crop]").forEach((input) => {
        input.addEventListener("input", () => {
          const item = getSelected();
          if (!item) return;
          const cropKey = input.dataset.itemCrop;
          const value = Math.max(0, Math.min(90, Number(input.value) || 0));
          item.crop = { ...(item.crop || {}), [cropKey]: value };
          inspector.querySelectorAll(`[data-item-crop="${cropKey}"]`).forEach((paired) => {
            if (paired !== input) paired.value = value;
          });
          renderWorld();
          scheduleSave();
        });
      });

      inspector.querySelector("[data-crop-reset]")?.addEventListener("click", () => {
        const item = getSelected();
        if (!item) return;
        item.crop = { left: 0, top: 0, right: 0, bottom: 0 };
        renderWorld();
        renderInspector();
        scheduleSave();
      });

      inspector.querySelectorAll("[data-item-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.itemAction;
          const item = getSelected();
          if (!item) return;
          if (action === "delete") deleteSelected();
          if (action === "duplicate") duplicateSelected();
          if (action === "front") {
            item.z = Math.max(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) + 1;
            renderWorld();
            scheduleSave();
          }
          if (action === "back") {
            item.z = Math.min(0, ...(state.board.items || []).map((entry) => Number(entry.z || 0))) - 1;
            renderWorld();
            scheduleSave();
          }
        });
      });

      inspector.querySelector("[data-portal-focus]")?.addEventListener("click", () => {
        const item = getSelected();
        if (item?.kind === "portal") focusPortalPartner(item);
      });
      inspector.querySelector("[data-portal-name]")?.addEventListener("input", (event) => {
        const item = getSelected();
        if (item?.kind !== "portal") return;
        const name = event.target.value || t("portal");
        item.name = name;
        const partner = (state.board.items || []).find((entry) => entry.id === item.linkId);
        if (partner) partner.name = name;
        renderWorld();
        scheduleSave();
      });
    }

    function bindShellEvents() {
      const stage = document.getElementById("canvas-stage");
      document.querySelector("[data-toggle-board-left]")?.addEventListener("click", () => toggleBoardPanel("left"));
      document.querySelector("[data-toggle-board-right]")?.addEventListener("click", () => toggleBoardPanel("right"));
      document.querySelectorAll("[data-toggle-all-toolbars]").forEach((button) => {
        button.addEventListener("click", toggleAllToolbars);
      });
      let panning = false;
      let startX = 0;
      let startY = 0;
      let originX = 0;
      let originY = 0;
      let marquee = null;

      stage.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".canvas-footer,.immersive-restore")) return;
        if (state.spaceDown) {
          if (event.button !== 0 && event.button !== 1) return;
          event.preventDefault();
          panning = true;
          startX = event.clientX;
          startY = event.clientY;
          originX = state.panX;
          originY = state.panY;
          stage.classList.add("panning");
          stage.setPointerCapture(event.pointerId);
          return;
        }
        if (event.target.closest(".board-item")) return;
        if (event.button !== 0 && event.button !== 1) return;
        if (event.button === 0 && !state.spaceDown) {
          event.preventDefault();
          const rect = stage.getBoundingClientRect();
          const overlay = document.createElement("div");
          overlay.className = "canvas-marquee";
          stage.append(overlay);
          marquee = {
            startX: event.clientX,
            startY: event.clientY,
            left: event.clientX - rect.left,
            top: event.clientY - rect.top,
            overlay,
            additive: event.ctrlKey || event.metaKey,
            moved: false
          };
          if (!marquee.additive) {
            selectOnly(null);
            refreshSelectionDom();
            renderInspector();
          }
          stage.setPointerCapture(event.pointerId);
          return;
        }
        panning = true;
        startX = event.clientX;
        startY = event.clientY;
        originX = state.panX;
        originY = state.panY;
        stage.classList.add("panning");
        stage.setPointerCapture(event.pointerId);
      });
      stage.addEventListener("pointermove", (event) => {
        if (panning) {
          state.panX = originX + event.clientX - startX;
          state.panY = originY + event.clientY - startY;
          applyViewport();
          return;
        }
        if (marquee) {
          const rect = stage.getBoundingClientRect();
          const currentX = event.clientX - rect.left;
          const currentY = event.clientY - rect.top;
          const deltaX = Math.abs(event.clientX - marquee.startX);
          const deltaY = Math.abs(event.clientY - marquee.startY);
          if (deltaX > 3 || deltaY > 3) marquee.moved = true;
          marquee.overlay.style.left = `${Math.min(marquee.left, currentX)}px`;
          marquee.overlay.style.top = `${Math.min(marquee.top, currentY)}px`;
          marquee.overlay.style.width = `${Math.abs(currentX - marquee.left)}px`;
          marquee.overlay.style.height = `${Math.abs(currentY - marquee.top)}px`;
        }
      });
      stage.addEventListener("pointerup", (event) => {
        if (marquee) {
          if (marquee.moved) {
            const startWorld = screenToWorld(marquee.startX, marquee.startY);
            const endWorld = screenToWorld(event.clientX, event.clientY);
            const selectionRect = {
              left: Math.min(startWorld.x, endWorld.x),
              right: Math.max(startWorld.x, endWorld.x),
              top: Math.min(startWorld.y, endWorld.y),
              bottom: Math.max(startWorld.y, endWorld.y)
            };
            if (!marquee.additive) selectOnly(null);
            for (const item of state.board.items || []) {
              const bounds = itemWorldBounds(item);
              if (bounds.right >= selectionRect.left &&
                  bounds.left <= selectionRect.right &&
                  bounds.bottom >= selectionRect.top &&
                  bounds.top <= selectionRect.bottom) {
                state.selectedIds.add(item.id);
                state.selectedId = item.id;
              }
            }
            refreshSelectionDom();
            renderInspector();
          }
          marquee.overlay.remove();
          marquee = null;
          return;
        }
        if (panning) scheduleSave();
        panning = false;
        stage.classList.remove("panning");
      });
      stage.addEventListener("pointercancel", () => {
        marquee?.overlay.remove();
        marquee = null;
        panning = false;
        stage.classList.remove("panning");
      });
      stage.addEventListener("wheel", (event) => {
        event.preventDefault();
        const rect = stage.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldX = (mouseX - state.panX) / state.zoom;
        const worldY = (mouseY - state.panY) / state.zoom;
        const nextZoom = Math.max(0.08, Math.min(6, state.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
        state.panX = mouseX - worldX * nextZoom;
        state.panY = mouseY - worldY * nextZoom;
        state.zoom = nextZoom;
        applyViewport();
        scheduleSave();
      }, { passive: false });
      stage.addEventListener("dragover", (event) => {
        if (event.dataTransfer?.types.includes("application/x-megabox-asset")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      });
      stage.addEventListener("drop", (event) => {
        const assetId = event.dataTransfer?.getData("application/x-megabox-asset");
        if (!assetId) return;
        event.preventDefault();
        addAsset(assetId, screenToWorld(event.clientX, event.clientY));
      });

      document.getElementById("board-asset-search").addEventListener("input", (event) => {
        state.assetQuery = event.target.value;
        renderMiniAssets();
      });

      document.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
          const action = button.dataset.action;
          if (action === "add-note") addNote();
          if (action === "add-arrow") addArrow();
          if (action === "add-portal") addPortalPair();
          if (action === "add-frame") addFrame();
          if (action === "fit-board") fitBoard();
          if (action === "save") saveNow();
          if (action === "zoom-in") {
            state.zoom = Math.min(6, state.zoom * 1.15);
            applyViewport();
            scheduleSave();
          }
          if (action === "zoom-out") {
            state.zoom = Math.max(0.08, state.zoom / 1.15);
            applyViewport();
            scheduleSave();
          }
          if (action === "import-assets") {
            try {
              const result = await invoke("files.import");
              if (!result.canceled) {
                const fresh = await invoke("library.get");
                boardFolders = fresh.folders || [];
                (fresh.assets || []).forEach((asset) => assetsById.set(asset.id, asset));
                renderMiniAssets();
                toast(t("importedAssets", { count: result.count }));
              }
            } catch (error) {
              toast(error.message, "error");
            }
          }
        });
      });

    }

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space" && !event.repeat && !event.target.matches("input, textarea")) {
        state.spaceDown = true;
        event.preventDefault();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && !event.target.matches("input, textarea")) {
        event.preventDefault();
        deleteSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveNow();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "t" && !event.target.matches("input, textarea")) {
        addNote();
      }
      if (event.key === "Escape") {
        selectOnly(null);
        renderWorld();
        renderInspector();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.code === "Space") state.spaceDown = false;
    });
    window.addEventListener("beforeunload", () => {
      if (state.dirty) {
        state.board.viewport = { x: state.panX, y: state.panY, zoom: state.zoom };
        invoke("board.save", { board: state.board }).catch(() => {});
      }
    });

    bindFileDrop(async (items) => {
      const fresh = await invoke("library.get");
      boardFolders = fresh.folders || [];
      (fresh.assets || []).forEach((asset) => assetsById.set(asset.id, asset));
      renderMiniAssets();
      const last = items.at(-1);
      if (last?.id) await addAsset(last.id);
    });
    window.addEventListener("focus", () => {
      const language = getLanguage();
      if (language !== renderedLanguage) {
        renderedLanguage = language;
        document.documentElement.lang = language;
        renderShell();
      }
    });
    window.addEventListener("storage", (event) => {
      if (event.key === "megabox.settings.language") {
        const language = getLanguage();
        if (language !== renderedLanguage) {
          renderedLanguage = language;
          document.documentElement.lang = language;
          renderShell();
        }
      }
    });
    assetHoverPreview.bind(app, (assetId) => assetsById.get(assetId));
    renderShell();
  }

  async function startPreferences() {
    const render = () => {
      const language = getLanguage();
      const languageName = supportedLanguages.find((item) => item.code === language)?.nativeName || language;
      document.documentElement.lang = language;
      document.title = `${t("preferences")} — MegaBox`;
      app.innerHTML = `
        <div class="preferences-shell">
          <aside class="preferences-nav">
            <div class="preferences-brand">
              <div class="brand-mark">M</div>
              <div>
                <strong>${t("preferences")}</strong>
                <span>MegaBox</span>
              </div>
            </div>
            <nav>
              <button type="button" disabled>${icon("settings")}${t("general")}</button>
              <button type="button" disabled>${icon("frame")}${t("appearance")}</button>
              <button type="button" class="active">${icon("globe")}${t("language")}</button>
            </nav>
            <div class="preferences-version">MegaBox 0.2</div>
          </aside>
          <main class="preferences-main">
            <header class="preferences-heading">
              <div class="eyebrow">${t("settingsEyebrow")}</div>
              <h1>${t("preferences")}</h1>
              <p>${t("preferencesSubtitle")}</p>
            </header>
            <div class="preferences-content">
              <section class="preferences-card language-settings">
                <div class="preferences-card-head">
                  <div class="preferences-icon">${icon("globe")}</div>
                  <div>
                    <h2>${t("languageTitle")}</h2>
                    <p>${t("languageDescription")}</p>
                  </div>
                </div>
                <div class="preference-row">
                  <div>
                    <strong>${t("currentLanguage")}</strong>
                    <span>${escapeHtml(languageName)}</span>
                  </div>
                </div>
                <div class="language-select-row">
                  <label for="language-select">${t("languageTitle")}</label>
                  <select id="language-select" data-language-select>
                    ${supportedLanguages.map((option) => `<option value="${option.code}" ${option.code === language ? "selected" : ""}>${escapeHtml(option.nativeName)}${option.englishName && option.code !== "en-US" ? ` — ${escapeHtml(option.englishName)}` : ""}</option>`).join("")}
                  </select>
                </div>
                <div class="preferences-note">${t("languageSaved")}</div>
              </section>
            </div>
          </main>
        </div>`;
      app.querySelector("[data-language-select]")?.addEventListener("change", (event) => {
          setLanguage(event.target.value);
          render();
      });
    };
    render();
  }

  async function start() {
    try {
      if (view === "image") {
        await startImageViewer(params.get("id"));
      } else if (view === "board") {
        await startBoardViewer(params.get("id"));
      } else if (view === "preferences") {
        await startPreferences();
      } else {
        await startLibrary();
      }
    } catch (error) {
      app.innerHTML = `<div class="empty-state" style="height:100%;border:0;border-radius:0">
        <div class="empty-illustration">${icon("close")}</div>
        <h2>${t("unableOpenWindow")}</h2>
        <p>${escapeHtml(error.message)}</p>
        <button class="button" onclick="location.reload()">${t("retry")}</button>
      </div>`;
    }
  }

  start();
})();
