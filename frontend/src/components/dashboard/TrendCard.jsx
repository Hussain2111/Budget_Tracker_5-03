import { Card, Statistic, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

/**
 * TrendCard - Displays a metric with Month-over-Month delta
 * @param {string} title - Card title (e.g., "Income")
 * @param {string} value - Formatted current value
 * @param {number} deltaPercent - MoM percentage change (positive or negative)
 * @param {string} color - Value color (e.g., "#3f8600" for positive, "#cf1322" for negative)
 * @param {string} borderColor - Top border color for visual distinction
 * @param {boolean} invertPositive - For expenses: true = down is good (green), up is bad (red). Default false.
 */
export const TrendCard = ({ title, value, deltaPercent, color, borderColor, invertPositive = false }) => {
    // Separate arrow direction from semantic meaning
    const actuallyIncreased = deltaPercent > 0; // Arrow direction: always based on sign
    
    // Semantic meaning: is this change good or bad?
    let isGood = actuallyIncreased; // Default: up is good
    if (invertPositive) {
        isGood = !actuallyIncreased; // For expenses: down is good
    }

    // Only show tag if delta is non-zero
    const showDelta = deltaPercent !== null && deltaPercent !== undefined && deltaPercent !== 0;
    const deltaColor = isGood ? "#3f8600" : "#cf1322";
    const DeltaIcon = actuallyIncreased ? ArrowUpOutlined : ArrowDownOutlined;

    return (
        <Card
            className="stat-card"
            style={{ borderTop: `3px solid ${borderColor}`, height: "100%" }}
        >
            <Statistic
                title={title}
                value={value}
                prefix="$"
                styles={{ content: { color, fontSize: 24 } }}
            />
            {showDelta && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag color={isGood ? "success" : "error"}>
                        <DeltaIcon />
                        {deltaPercent > 0 ? "+" : ""}{deltaPercent}% vs last month
                    </Tag>
                </div>
            )}
        </Card>
    );
};

export default TrendCard;
