
"use client";

import { useMemo, useRef, useState } from "react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import Papa from "papaparse";
import { toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import {
    BarChart3,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    AreaChart as AreaChartIcon,
    Radar as RadarIcon,
    ScatterChart as ScatterIcon,
    Upload,
    Download,
    Plus,
    Trash2,
    Copy,
    RotateCcw,
    FileSpreadsheet,
    Image as ImageIcon,
    FileText,
    Check,
    Palette,
} from "lucide-react";

type ChartType =
    | "bar"
    | "line"
    | "area"
    | "pie"
    | "doughnut"
    | "scatter"
    | "radar";

type DataRow = Record<string, string | number>;

const COLORS = [
    "#C77B53",
    "#65A8A0",
    "#8C83D6",
    "#D9A441",
    "#6C9ED1",
    "#D47791",
    "#8BA66B",
    "#A78BFA",
];

const INITIAL_ROWS: DataRow[] = [
    { Month: "January", Sales: 1200, Profit: 450 },
    { Month: "February", Sales: 1800, Profit: 700 },
    { Month: "March", Sales: 1500, Profit: 580 },
    { Month: "April", Sales: 2300, Profit: 950 },
    { Month: "May", Sales: 2100, Profit: 820 },
    { Month: "June", Sales: 2800, Profit: 1200 },
];

const CHART_OPTIONS: {
    type: ChartType;
    label: string;
    icon: typeof BarChart3;
}[] = [
        { type: "bar", label: "Bar", icon: BarChart3 },
        { type: "line", label: "Line", icon: LineChartIcon },
        { type: "area", label: "Area", icon: AreaChartIcon },
        { type: "pie", label: "Pie", icon: PieChartIcon },
        { type: "doughnut", label: "Doughnut", icon: PieChartIcon },
        { type: "scatter", label: "Scatter", icon: ScatterIcon },
        { type: "radar", label: "Radar", icon: RadarIcon },
    ];

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
}

export function ChartMakerWorkspace() {
    const chartRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [chartType, setChartType] = useState<ChartType>("bar");
    const [rows, setRows] = useState<DataRow[]>(INITIAL_ROWS);
    const [title, setTitle] = useState("Monthly Business Performance");
    const [subtitle, setSubtitle] = useState("Sales and profit overview");
    const [xLabel, setXLabel] = useState("Month");
    const [yLabel, setYLabel] = useState("Amount");
    const [background, setBackground] = useState("#111414");
    const [showLegend, setShowLegend] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const columns = useMemo(
        () => Object.keys(rows[0] || {}),
        [rows]
    );

    const labelKey = columns[0] || "Category";

    const numericKeys = useMemo(() => {
        return columns.filter((key) =>
            rows.some(
                (row) =>
                    row[key] !== "" &&
                    row[key] !== null &&
                    row[key] !== undefined &&
                    Number.isFinite(Number(row[key]))
            )
        );
    }, [columns, rows]);

    const chartData = useMemo(() => {
        return rows.map((row) => {
            const result: Record<string, string | number> = {
                [labelKey]: String(row[labelKey] ?? ""),
            };

            numericKeys.forEach((key) => {
                const value = Number(row[key]);
                result[key] = Number.isFinite(value) ? value : 0;
            });

            return result;
        });
    }, [rows, labelKey, numericKeys]);

    const validData =
        rows.length > 0 &&
        numericKeys.length > 0 &&
        chartData.some((row) =>
            numericKeys.some((key) => Number.isFinite(Number(row[key])))
        );

    function updateCell(
        rowIndex: number,
        key: string,
        value: string
    ) {
        setRows((previous) =>
            previous.map((row, index) =>
                index === rowIndex
                    ? {
                        ...row,
                        [key]:
                            key === labelKey
                                ? value
                                : value === ""
                                    ? ""
                                    : Number.isNaN(Number(value))
                                        ? value
                                        : Number(value),
                    }
                    : row
            )
        );
    }

    function addRow() {
        const newRow: DataRow = {};

        columns.forEach((key, index) => {
            newRow[key] = index === 0 ? `Item ${rows.length + 1}` : 0;
        });

        setRows((previous) => [...previous, newRow]);
    }

    function removeRow(index: number) {
        setRows((previous) =>
            previous.filter((_, rowIndex) => rowIndex !== index)
        );
    }

    function addColumn() {
        let name = `Series ${columns.length}`;

        while (columns.includes(name)) {
            name = `${name} New`;
        }

        setRows((previous) =>
            previous.map((row) => ({ ...row, [name]: 0 }))
        );
    }

    function removeColumn(key: string) {
        if (columns.length <= 2) {
            setMessage("At least two columns are required.");
            return;
        }

        setRows((previous) =>
            previous.map((row) => {
                const updated = { ...row };
                delete updated[key];
                return updated;
            })
        );
    }

    function loadSample() {
        setRows(INITIAL_ROWS);
        setChartType("bar");
        setTitle("Monthly Business Performance");
        setSubtitle("Sales and profit overview");
        setMessage("Sample data loaded.");
    }

    function resetWorkspace() {
        setRows(INITIAL_ROWS);
        setChartType("bar");
        setTitle("Monthly Business Performance");
        setSubtitle("Sales and profit overview");
        setXLabel("Month");
        setYLabel("Amount");
        setBackground("#111414");
        setShowLegend(true);
        setShowGrid(true);
        setShowLabels(false);
        setMessage("Workspace reset.");
    }

    function importCSV(file?: File) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setMessage("Please select a CSV file.");
            return;
        }

        Papa.parse<DataRow>(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (result) => {
                const importedRows = result.data.filter(
                    (row) => Object.keys(row).length > 1
                );

                if (!importedRows.length) {
                    setMessage("The CSV file contains no usable data.");
                    return;
                }

                setRows(importedRows);
                setMessage(
                    `Imported ${importedRows.length} rows successfully.`
                );
            },
            error: () => {
                setMessage("Could not read this CSV file.");
            },
        });
    }

    async function exportChart(format: "png" | "svg" | "pdf") {
        if (!chartRef.current || !validData) {
            setMessage("Add valid data before exporting.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const node = chartRef.current;
            const filename = "brobex-chart";

            if (format === "svg") {
                const svg = await toSvg(node, {
                    backgroundColor: background,
                    pixelRatio: 2,
                });

                downloadFile(svg, `${filename}.svg`, "image/svg+xml");
            }

            if (format === "png") {
                const png = await toPng(node, {
                    backgroundColor: background,
                    pixelRatio: 3,
                    cacheBust: true,
                });

                const anchor = document.createElement("a");
                anchor.href = png;
                anchor.download = `${filename}.png`;
                anchor.click();
            }

            if (format === "pdf") {
                const png = await toPng(node, {
                    backgroundColor: background,
                    pixelRatio: 2,
                    cacheBust: true,
                });

                const pdf = new jsPDF({
                    orientation: "landscape",
                    unit: "mm",
                    format: "a4",
                });

                pdf.setFillColor(17, 20, 20);
                pdf.rect(0, 0, 297, 210, "F");
                pdf.addImage(png, "PNG", 10, 10, 277, 155);
                pdf.save(`${filename}.pdf`);
            }

            setMessage(`${format.toUpperCase()} exported successfully.`);
        } catch {
            setMessage(
                "Export failed. Try again or use another export format."
            );
        } finally {
            setLoading(false);
        }
    }

    async function copyChart() {
        if (!chartRef.current || !validData) return;

        try {
            const dataUrl = await toPng(chartRef.current, {
                backgroundColor: background,
                pixelRatio: 2,
            });

            const blob = await (await fetch(dataUrl)).blob();

            if (!navigator.clipboard || !window.ClipboardItem) {
                setMessage("Image copying is not supported in this browser.");
                return;
            }

            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);

            setMessage("Chart copied to clipboard.");
        } catch {
            setMessage(
                "Could not copy the chart. Check browser clipboard permissions."
            );
        }
    }

    const chartStyle = {
        color: "#C6CECA",
        fontSize: 12,
    };

    function renderChart() {
        if (!validData) {
            return (
                <div className="flex h-full min-h-[300px] items-center justify-center text-center">
                    <div>
                        <BarChart3 className="mx-auto mb-4 h-10 w-10 text-[#C77B53]" />
                        <p className="font-semibold text-white">
                            Your chart will appear here
                        </p>
                        <p className="mt-2 text-sm text-white/45">
                            Add numeric data to generate your chart.
                        </p>
                    </div>
                </div>
            );
        }

        if (chartType === "pie" || chartType === "doughnut") {
            const key = numericKeys[0];

            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={key}
                            nameKey={labelKey}
                            cx="50%"
                            cy="50%"
                            innerRadius={chartType === "doughnut" ? "55%" : 0}
                            outerRadius="78%"
                            paddingAngle={3}
                            label={showLabels}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        {showLegend && <Legend />}
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === "radar") {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData}>
                        <PolarGrid stroke="#38413F" />
                        <PolarAngleAxis dataKey={labelKey} stroke="#AAB3AE" />
                        <PolarRadiusAxis stroke="#64706A" />
                        {numericKeys.map((key, index) => (
                            <Radar
                                key={key}
                                name={key}
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.18}
                            />
                        ))}
                        <Tooltip />
                        {showLegend && <Legend />}
                    </RadarChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === "scatter") {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                        {showGrid && <CartesianGrid stroke="#303A36" />}
                        <XAxis
                            type="number"
                            dataKey={numericKeys[0]}
                            name={numericKeys[0]}
                            stroke="#AAB3AE"
                            tick={chartStyle}
                            label={{ value: xLabel, position: "insideBottom", offset: -5 }}
                        />
                        <YAxis
                            type="number"
                            dataKey={numericKeys[1] || numericKeys[0]}
                            name={numericKeys[1] || numericKeys[0]}
                            stroke="#AAB3AE"
                            tick={chartStyle}
                            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                        />
                        <ZAxis range={[60, 60]} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter
                            name={title}
                            data={chartData}
                            fill={COLORS[0]}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            );
        }

        const commonAxes = (
            <>
                {showGrid && (
                    <CartesianGrid stroke="#303A36" strokeDasharray="4 4" />
                )}
                <XAxis
                    dataKey={labelKey}
                    stroke="#AAB3AE"
                    tick={chartStyle}
                    label={{
                        value: xLabel,
                        position: "insideBottom",
                        offset: -5,
                        fill: "#AAB3AE",
                    }}
                />
                <YAxis
                    stroke="#AAB3AE"
                    tick={chartStyle}
                    label={{
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                        fill: "#AAB3AE",
                    }}
                />
                <Tooltip
                    contentStyle={{
                        background: "#171D1B",
                        border: "1px solid #38413F",
                        borderRadius: 10,
                        color: "#fff",
                    }}
                />
                {showLegend && <Legend />}
            </>
        );

        if (chartType === "line") {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        {commonAxes}
                        {numericKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === "area") {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        {commonAxes}
                        {numericKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.16}
                                strokeWidth={2.5}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    {commonAxes}
                    {numericKeys.map((key, index) => (
                        <Bar
                            key={key}
                            dataKey={key}
                            fill={COLORS[index % COLORS.length]}
                            radius={[5, 5, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    }

    const panel =
        "rounded-2xl border border-white/[0.09] bg-[#141918] p-4 sm:p-5";

    const field =
        "w-full rounded-lg border border-white/10 bg-[#0D1210] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#C77B53]";

    const button =
        "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-white/80 transition hover:border-[#C77B53]/60 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="rounded-xl border border-[#C77B53]/30 bg-[#C77B53]/10 p-2">
                            <BarChart3 className="h-5 w-5 text-[#D99770]" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">
                            Chart Maker
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-white/45">
                        Turn your data into clear, professional visualizations.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className={button} onClick={loadSample}>
                        <FileSpreadsheet size={15} />
                        Sample data
                    </button>
                    <button className={button} onClick={resetWorkspace}>
                        <RotateCcw size={15} />
                        Reset
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                    importCSV(event.target.files?.[0]);
                    event.currentTarget.value = "";
                }}
            />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1.15fr)]">
                <div className="space-y-5">
                    <section className={panel}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold">Your data</h3>
                                <p className="mt-1 text-xs text-white/40">
                                    Edit values or import a CSV spreadsheet.
                                </p>
                            </div>
                            <button
                                className={button}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} />
                                Import CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full min-w-[390px] border-collapse text-left text-xs">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        {columns.map((column) => (
                                            <th
                                                key={column}
                                                className="min-w-[100px] border-b border-white/10 p-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{column}</span>
                                                    {column !== labelKey && (
                                                        <button
                                                            title={`Remove ${column}`}
                                                            onClick={() => removeColumn(column)}
                                                            className="text-white/30 hover:text-red-400"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="border-b border-white/10 p-2">
                                            Remove
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIndex) => (
                                        <tr
                                            key={rowIndex}
                                            className="border-b border-white/[0.06] last:border-0"
                                        >
                                            {columns.map((column) => (
                                                <td key={column} className="p-1.5">
                                                    <input
                                                        aria-label={`${column}, row ${rowIndex + 1}`}
                                                        value={String(row[column] ?? "")}
                                                        onChange={(event) =>
                                                            updateCell(
                                                                rowIndex,
                                                                column,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full min-w-[85px] rounded-md border border-transparent bg-transparent px-2 py-2 text-white outline-none focus:border-[#C77B53]/50 focus:bg-[#0D1210]"
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-2 text-center">
                                                <button
                                                    title="Remove row"
                                                    onClick={() => removeRow(rowIndex)}
                                                    className="text-white/30 hover:text-red-400"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <button className={button} onClick={addRow}>
                                <Plus size={14} />
                                Add row
                            </button>
                            <button className={button} onClick={addColumn}>
                                <Plus size={14} />
                                Add column
                            </button>
                        </div>
                    </section>

                    <section className={panel}>
                        <h3 className="mb-4 font-semibold">Chart type</h3>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {CHART_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const active = chartType === option.type;

                                return (
                                    <button
                                        key={option.type}
                                        onClick={() => setChartType(option.type)}
                                        className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${active
                                                ? "border-[#C77B53]/70 bg-[#C77B53]/10 text-[#E3A47F]"
                                                : "border-white/[0.08] bg-[#0D1210] text-white/55 hover:border-white/20 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className={panel}>
                        <div className="mb-4 flex items-center gap-2">
                            <Palette size={17} className="text-[#D99770]" />
                            <h3 className="font-semibold">Chart customization</h3>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1.5 text-xs text-white/55">
                                Chart title
                                <input
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className={field}
                                    placeholder="Enter chart title"
                                />
                            </label>

                            <label className="space-y-1.5 text-xs text-white/55">
                                Subtitle
                                <input
                                    value={subtitle}
                                    onChange={(event) => setSubtitle(event.target.value)}
                                    className={field}
                                    placeholder="Enter subtitle"
                                />
                            </label>

                            <label className="space-y-1.5 text-xs text-white/55">
                                X-axis label
                                <input
                                    value={xLabel}
                                    onChange={(event) => setXLabel(event.target.value)}
                                    className={field}
                                />
                            </label>

                            <label className="space-y-1.5 text-xs text-white/55">
                                Y-axis label
                                <input
                                    value={yLabel}
                                    onChange={(event) => setYLabel(event.target.value)}
                                    className={field}
                                />
                            </label>

                            <label className="space-y-1.5 text-xs text-white/55 sm:col-span-2">
                                Chart background
                                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0D1210] p-2">
                                    <input
                                        type="color"
                                        value={background}
                                        onChange={(event) => setBackground(event.target.value)}
                                        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                                    />
                                    <span className="text-xs text-white/70">
                                        {background.toUpperCase()}
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4">
                            {[
                                ["Show legend", showLegend, setShowLegend],
                                ["Show grid", showGrid, setShowGrid],
                                ["Show data labels", showLabels, setShowLabels],
                            ].map(([label, checked, setter]) => (
                                <label
                                    key={String(label)}
                                    className="flex cursor-pointer items-center gap-2 text-xs text-white/65"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked as boolean}
                                        onChange={(event) =>
                                            (setter as (value: boolean) => void)(
                                                event.target.checked
                                            )
                                        }
                                        className="accent-[#C77B53]"
                                    />
                                    {String(label)}
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-5">
                    <section className={panel}>
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                        Live preview
                                    </span>
                                </div>
                                <h3 className="mt-2 text-lg font-bold">
                                    {title || "Untitled chart"}
                                </h3>
                                <p className="mt-1 text-xs text-white/45">
                                    {subtitle}
                                </p>
                            </div>
                            <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-white/45">
                                {chartType.toUpperCase()} CHART
                            </span>
                        </div>

                        <div
                            ref={chartRef}
                            className="w-full rounded-xl p-3 sm:p-5"
                            style={{ backgroundColor: background }}
                        >
                            <div className="mb-3">
                                <p className="text-sm font-semibold text-white">
                                    {title || "Untitled chart"}
                                </p>
                                <p className="mt-1 text-xs text-white/45">
                                    {subtitle}
                                </p>
                            </div>
                            <div className="h-[340px] w-full sm:h-[410px]">
                                {renderChart()}
                            </div>
                            <div className="mt-3 border-t border-white/10 pt-3 text-center text-[9px] text-white/30">
                                Created with BROBEX Chart Maker
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                className={button}
                                disabled={loading || !validData}
                                onClick={() => exportChart("png")}
                            >
                                <ImageIcon size={14} />
                                PNG
                            </button>
                            <button
                                className={button}
                                disabled={loading || !validData}
                                onClick={() => exportChart("svg")}
                            >
                                <Download size={14} />
                                SVG
                            </button>
                            <button
                                className={button}
                                disabled={loading || !validData}
                                onClick={() => exportChart("pdf")}
                            >
                                <FileText size={14} />
                                PDF
                            </button>
                            <button
                                className={button}
                                disabled={loading || !validData}
                                onClick={copyChart}
                            >
                                <Copy size={14} />
                                Copy
                            </button>
                        </div>

                        {loading && (
                            <p className="mt-3 text-xs text-[#D99770]">
                                Preparing your chart export...
                            </p>
                        )}

                        {message && (
                            <p
                                role="status"
                                className="mt-3 flex items-center gap-2 text-xs text-emerald-300"
                            >
                                <Check size={14} />
                                {message}
                            </p>
                        )}
                    </section>

                    <section className={panel}>
                        <h3 className="font-semibold">Chart information</h3>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {[
                                ["Data rows", rows.length],
                                ["Data columns", columns.length],
                                ["Numeric series", numericKeys.length],
                                ["Chart type", chartType.toUpperCase()],
                            ].map(([label, value]) => (
                                <div
                                    key={String(label)}
                                    className="rounded-xl border border-white/[0.07] bg-[#0D1210] p-3"
                                >
                                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-white">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <p className="text-center text-[11px] text-white/35">
                Your chart data is processed locally in your browser.
            </p>
        </div>
    );
}
