import { ReportAssetData, ReportData } from "./createReportData";

const getFileName = (reportAssetData: ReportAssetData) => {
  const name = reportAssetData.isAdded
    ? `🆕  ${reportAssetData.name}`
    : reportAssetData.name;

  return reportAssetData.isRemoved ? `~~${name}~~` : `${name}`;
};

const getPercentage = (reportAssetData: ReportAssetData) => {
  if (reportAssetData.isAdded || reportAssetData.isRemoved) {
    return "";
  }

  const refSize = reportAssetData.size - reportAssetData.diff;
  const percentage = (100 / refSize) * Math.abs(reportAssetData.diff);

  if (reportAssetData.isIncrease) {
    return percentage > 5
      ? `<b>+${percentage.toFixed(2)}%</b>`
      : `+${percentage.toFixed(2)}%`;
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

  return `${size}`;
};

const getDiff = (reportAssetData: ReportAssetData) => {
  const diff = reportAssetData.isAdded
    ? reportAssetData.size
    : reportAssetData.diff;

  const formattedDiff = formatBytes(diff);

  return `${formattedDiff}`;
};

const getPercentageAndIcon = (
  reportAssetData: ReportAssetData,
  minimumIncrease: number
) => {
  const percentage = getPercentage(reportAssetData);
  const icon = getEmoji(reportAssetData, minimumIncrease);

  return `${percentage} ${icon}`;
};

type DiffAttentionLevel = "comment" | "mention" | "review";

const getDiffAttentionLevel = (
  reportData: ReportData,
  atMentionThreshold: number
): DiffAttentionLevel => {
  let diffAttentionLevel: DiffAttentionLevel = "comment";
  for (let reportAssetData of reportData.assets) {
    if (reportAssetData.isRemoved) {
      continue;
    }
    const refSize = reportAssetData.size - reportAssetData.diff;
    const percentage = (100 / refSize) * Math.abs(reportAssetData.diff);
    if (percentage >= atMentionThreshold) {
      if (reportAssetData.isKeyAsset) {
        diffAttentionLevel = "review";
        break;
      } else {
        diffAttentionLevel = "mention";
      }
    }
  }
  return diffAttentionLevel;
};

export function createDetailedReport(
  reportData: ReportData,
  minimumIncrease: number,
  diffAttentionThreshold: number
): string {
  if (reportData.totalDiff === 0) {
    return "";
  }

  const comparisonLink = reportData.comparisonToolUrl
    ? `<a target="_blank" rel="noopener noreferrer" href="${reportData.comparisonToolUrl}">🔍</a>`
    : "";

  const percentageChange =
    (reportData.baselineSize === 0
      ? 100 : (Math.abs(reportData.totalDiff) / reportData.baselineSize) * 100).toFixed(2);

  const diffSign = getReducedOrIncreased(reportData.totalDiff);
  const diffFormatBytes = formatBytes(Math.abs(reportData.totalDiff));
  const isIncrease = reportData.totalDiff > 0;

  const emoji = getEmojiForTotalAssetChange(isIncrease);
  const color = getTextColorForTotalAssetChange(isIncrease);

  const deltaSizeMessage = `<strong style="color:${color}">(${diffSign}${diffFormatBytes} | ${diffSign}${percentageChange}%)</strong>`;
  const totalSizeMessage = `${formatBytes(reportData.totalSize)}`;
  const diffAttentionLevel = getDiffAttentionLevel(reportData, diffAttentionThreshold);
  const ownersMessage =
    (diffAttentionLevel !== "comment" && reportData.ownedBy?.map((owner) => `@${owner}`).join(" ")) || "";

 
  const prefix = `<summary style="font-size:16px" data-level="${diffAttentionLevel}" data-owners="${ownersMessage}">${emoji} ${
    reportData.name
  } = ${totalSizeMessage} ${deltaSizeMessage} ${comparisonLink} ${ownersMessage}</summary>`;

  const header =
    "\n| Asset&nbsp;name | Size | Diff | Percentage&nbsp;change | ";
  const headerSeparator = "|---|---|---|---|";

  const rows = reportData.assets.map((reportAssetData) => {
    const assetEmoji = reportAssetData.isKeyAsset ? "⭐" : "";
    const fileName = getFileName(reportAssetData);
    const size = getSize(reportAssetData);
    const diff = getDiff(reportAssetData);
    const percentage = getPercentageAndIcon(reportAssetData, minimumIncrease);

    return `| ${assetEmoji}${fileName} | ${size} | ${diff} | ${percentage} |`;
  });

  return `
  <details ${diffAttentionLevel == "review" ? " open": ""}>${[prefix, header, headerSeparator, ...rows].join(
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
  return diffSize > 0 ? "+" : "-";
}

function formatBytes(bytes: number, decimals: number = 2): string {
  const inKb = bytes / 1024;
  // &nbsp; instead of space to avoid line wrapping in table
  if (inKb > 1024) {
    return (inKb / 1024).toFixed(decimals) + "&nbsp;MB";
  }
  return inKb.toFixed(decimals) + "&nbsp;KB";
}

function getEmoji(
  reportAssetData: ReportAssetData,
  minimumIncrease: number
): string {
  if (reportAssetData.isRemoved || reportAssetData.isAdded) {
    return "";
  }
  return reportAssetData.diff > minimumIncrease ? "🔺" : "✅";
}

function getEmojiForTotalAssetChange(isIncrease: boolean): string {
  if (isIncrease) {
    return "⚠️";
  } else {
    return "🎉";
  }
}

function getTextColorForTotalAssetChange(isIncrease: boolean): string {
  if (isIncrease) {
    return "orangered";
  } else {
    // this is jade green - it gives reasonable contrast for both light and dark themes
    return "#00A36C";
  }
}
