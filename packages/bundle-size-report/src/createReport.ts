import { ReportAssetData, ReportData } from "./createReportData";

const noWrapStyle = "white-space: nowrap;";
const removedFileNameStyle = "text-decoration: line-through;";

const getFileNameStyle = (reportAssetData: { isRemoved: boolean }) =>
  reportAssetData.isRemoved ? removedFileNameStyle : "";

const getFileName = (reportAssetData: ReportAssetData) => {
  const name = reportAssetData.isAdded
    ? `🆕  ${reportAssetData.name}`
    : reportAssetData.name;

  return `<span style="${getFileNameStyle(reportAssetData)}">${name}</span>`;
};

const getPercentage = (reportAssetData: ReportAssetData) => {
  if (reportAssetData.isAdded || reportAssetData.isRemoved) {
    return "";
  }

  const refSize = reportAssetData.size - reportAssetData.diff;
  const percentage = (100 / refSize) * Math.abs(reportAssetData.diff);

  if (reportAssetData.isIncrease) {
    return `+${percentage.toFixed(2)}%`;
  }

  if (reportAssetData.isReduction) {
    return `-${percentage.toFixed(2)}%`;
  }

  return "";
};

const getSize = (reportAssetData: ReportAssetData) => {
  const size = formatBytes(
    reportAssetData.isRemoved
      ? Math.abs(reportAssetData.diff)
      : reportAssetData.size
  );

  return `<span style="${noWrapStyle}">${size}</span>`;
};

const getDiff = (reportAssetData: ReportAssetData) => {
  const diff = reportAssetData.isAdded
    ? reportAssetData.size
    : reportAssetData.diff;

  const formattedDiff = formatBytes(diff);

  return `<span style="${noWrapStyle}">${formattedDiff}</span>`;
};

const getPercentageAndIcon = (reportAssetData: ReportAssetData) => {
  const percentage = getPercentage(reportAssetData);
  const icon = getEmoji(reportAssetData);

  return `<span style="${noWrapStyle}">${percentage} ${icon}</span>`;
};

export function createDetailedReport(reportData: ReportData): string {
  if (reportData.totalDiff === 0) {
    return "";
  }

  const comparisonLink = reportData.comparisonToolUrl
    ? `<a target="_blank" rel="noopener noreferrer" href="${reportData.comparisonToolUrl}">🔍</a>`
    : "";
  const deltaSizeMessage = `${getReducedOrIncreased(
    reportData.totalDiff
  )} total size by ${formatBytes(Math.abs(reportData.totalDiff))}`;
  const totalSizeMessage = `Total size: ${formatBytes(reportData.totalSize)}`;
  const prefix = `<summary><span style="font-size: 16px">${reportData.name} ${comparisonLink}</span><br><ul><li>${deltaSizeMessage}</li><li>${totalSizeMessage}</li></summary>`;

  const header = "\n| Asset name | Size | Diff | |";
  const headerSeparator = "|---|---|---|---|";

  const rows = reportData.assets.map((reportAssetData) => {
    const fileName = getFileName(reportAssetData);
    const size = getSize(reportAssetData);
    const diff = getDiff(reportAssetData);
    const percentage = getPercentageAndIcon(reportAssetData);

    return `| ${fileName} | ${size} | ${diff} | ${percentage} |`;
  });

  return `
  <details>${[prefix, header, headerSeparator, ...rows].join(
    "\n"
  )}\n</details>`;
}

export function createNoChangeReport(reportData: ReportData[]): string {
  if (reportData.length === 0) {
    return "";
  }

  const prefix = `<summary><span style="font-size: 16px">${
    reportData.length
  } bundle${
    reportData.length > 1 ? "s" : ""
  } with no significant changes</span><br/><span style="font-style: italic; font-size: 0.65rem">(Click to open)</span></summary>`;

  const header = "\n| Bundle name | Size |";
  const headerSeparator = "|---|---|";

  const rows = reportData.map((report) => {
    const bundleName = report.name;
    const size = formatBytes(report.totalSize);

    return `| ${bundleName} | ${size} |`;
  });

  return `
  <details>${[prefix, header, headerSeparator, ...rows].join(
    "\n"
  )}\n</details>`;
}

function getReducedOrIncreased(diffSize: number): string {
  return diffSize > 0 ? "🔺 Increased" : "✅ Reduced";
}

function formatBytes(bytes: number, decimals: number = 2): string {
  const inKb = bytes / 1000;
  if (inKb > 1000) {
    return (inKb / 1000).toFixed(decimals) + " MB";
  }
  return inKb.toFixed(decimals) + " KB";
}

function getEmoji(reportAssetData: ReportAssetData): string {
  if (reportAssetData.isRemoved || reportAssetData.isAdded) {
    return "";
  }
  return reportAssetData.isReduction ? "✅" : "🔺";
}
