type SparklineProps = {
  values: number[];
  height?: number;
};

export function Sparkline({ values, height = 86 }: SparklineProps) {
  const width = 280;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Open roles trend over 12 weeks"
    >
      <polyline
        fill="none"
        points={points}
        stroke="#0f766e"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * (height - 12) - 6}
        fill="#0f766e"
        r="3"
      />
    </svg>
  );
}
