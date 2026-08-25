import AppLogoIcon from './app-logo-icon';

export default function AppLogo({ subtitle }: { subtitle?: string }) {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    {import.meta.env.VITE_APP_NAME}
                </span>
                {subtitle && (
                    <span className="truncate text-xs leading-tight text-sidebar-foreground/65">
                        {subtitle}
                    </span>
                )}
            </div>
        </>
    );
}
