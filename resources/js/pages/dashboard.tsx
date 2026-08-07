import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard as dashboardRoute } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    FileText,
    FlaskConical,
    HeartPulse,
    Pill,
    Stethoscope,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type DashboardStat = {
    label: string;
    value: number;
    format: 'currency' | 'number';
    hint: string | null;
};

type DashboardChart = {
    title: string;
    description: string;
    data: { label: string; value: number }[];
};

type DashboardTable = {
    title: string;
    description: string;
    columns: string[];
    rows: Record<string, string | number | null>[];
};

type DashboardPayload = {
    role: string;
    title: string;
    description: string;
    stats: DashboardStat[];
    chart: DashboardChart | null;
    tables: DashboardTable[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboardRoute().url,
    },
];

const chartConfig = {
    value: {
        label: 'Total',
        color: 'var(--primary)',
    },
} satisfies ChartConfig;

const statIcons = [
    UsersRound,
    Stethoscope,
    CalendarDays,
    CircleDollarSign,
    FlaskConical,
    Pill,
    ClipboardList,
    HeartPulse,
];

export default function Dashboard({
    dashboard,
}: {
    dashboard: DashboardPayload;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold">
                            {dashboard.title}
                        </h1>
                        <span className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
                            {dashboard.role}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {dashboard.description}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {dashboard.stats.map((stat, index) => {
                        const Icon = statIcons[index % statIcons.length];

                        return (
                            <Card key={stat.label} className="gap-3 py-4">
                                <CardHeader className="flex-row items-start justify-between gap-3 px-4">
                                    <div className="grid gap-1">
                                        <CardTitle className="text-sm text-muted-foreground">
                                            {stat.label}
                                        </CardTitle>
                                        <div className="text-2xl font-semibold tabular-nums">
                                            {formatValue(stat)}
                                        </div>
                                    </div>
                                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                                        <Icon className="size-4" />
                                    </div>
                                </CardHeader>
                                {stat.hint && (
                                    <CardContent className="px-4 text-xs text-muted-foreground">
                                        {stat.hint}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.65fr)]">
                    {dashboard.chart && (
                        <Card className="gap-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="size-4" />
                                    {dashboard.chart.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {dashboard.chart.description}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-72 w-full"
                                >
                                    <BarChart
                                        data={dashboard.chart.data}
                                        margin={{
                                            left: 0,
                                            right: 8,
                                            top: 8,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            width={44}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="var(--color-value)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}

                    {dashboard.tables.map((table) => (
                        <DashboardTableCard key={table.title} table={table} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

function DashboardTableCard({ table }: { table: DashboardTable }) {
    return (
        <Card className="gap-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="size-4" />
                    {table.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {table.description}
                </p>
            </CardHeader>
            <CardContent>
                {table.rows.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {table.columns.map((column) => (
                                    <TableHead key={column}>{column}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {table.rows.map((row, index) => (
                                <TableRow key={index}>
                                    {table.columns.map((column) => (
                                        <TableCell key={column}>
                                            {formatCell(row[column])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No records to show.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatValue(stat: DashboardStat) {
    if (stat.format === 'currency') {
        return money(stat.value);
    }

    return number(stat.value);
}

function formatCell(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'number') {
        return value >= 1000 ? money(value) : number(value);
    }

    return value;
}

function number(value: number) {
    return new Intl.NumberFormat().format(value);
}

function money(value: number) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}
