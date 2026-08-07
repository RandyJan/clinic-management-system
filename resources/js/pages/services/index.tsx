import ServiceController from '@/actions/App/Http/Controllers/ServiceController';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as servicesIndex } from '@/routes/services';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { PencilLine, Plus, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
    type PaginatedServices,
    type ServiceCategory,
    type ServiceStatus,
} from './types';

type Filters = {
    search?: string;
    category?: ServiceCategory;
    status?: ServiceStatus;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Services', href: servicesIndex().url },
];

export default function ServicesIndex({
    services,
    filters,
    categories,
}: {
    services: PaginatedServices;
    filters: Filters;
    categories: ServiceCategory[];
    statuses: ServiceStatus[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            servicesIndex().url,
            {
                search: search || undefined,
                category: category === 'all' ? undefined : category,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Services</h1>
                        <p className="text-sm text-muted-foreground">
                            {services.total} clinic services
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                        <form
                            onSubmit={submitFilters}
                            className="flex flex-col gap-2 lg:flex-row lg:items-end"
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="service-search">Search</Label>
                                <Input
                                    id="service-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="lg:w-72"
                                    placeholder="Code, name, description"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label>Category</Label>
                                <Select
                                    value={category}
                                    onValueChange={(value) =>
                                        setCategory(
                                            value as ServiceCategory | 'all',
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full lg:w-52">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {categories.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(
                                            value as ServiceStatus | 'all',
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full lg:w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">
                                <Search />
                                Search
                            </Button>
                        </form>

                        <Button asChild>
                            <Link href={ServiceController.create().url}>
                                <Plus />
                                Create service
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="min-w-64">
                                        <div className="font-medium">
                                            {service.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {service.service_code}
                                        </div>
                                    </TableCell>
                                    <TableCell>{service.category}</TableCell>
                                    <TableCell>
                                        {formatCurrency(service.price)}
                                    </TableCell>
                                    <TableCell>
                                        <ServiceStatusBadge
                                            status={service.status}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(service.updated_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        ServiceController.edit(
                                                            service.id,
                                                        ).url
                                                    }
                                                >
                                                    <PencilLine />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {services.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No services found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <ServicesPagination services={services} />
            </div>
        </AppLayout>
    );
}

function ServicesPagination({ services }: { services: PaginatedServices }) {
    if (services.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {services.from ?? 0} to {services.to ?? 0} of{' '}
                {services.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {services.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                buttonVariants({
                                    variant: link.active
                                        ? 'default'
                                        : 'outline',
                                    size: 'sm',
                                }),
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'pointer-events-none opacity-50',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
    return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
    );
}

export function formatCurrency(value: string | number) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
