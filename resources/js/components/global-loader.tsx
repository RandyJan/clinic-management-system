import type { GlobalEvent, PendingVisit } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const LOADER_DELAY_MS = 150;
const MIN_VISIBLE_MS = 350;
const MODULE_LINK_SELECTOR = '[data-global-loader="module"]';

function shouldShowGlobalLoader(visit: PendingVisit): boolean {
    const isPartialReload = visit.only.length > 0 || visit.except.length > 0;
    const isSamePath =
        visit.url.pathname === window.location.pathname &&
        visit.url.origin === window.location.origin;
    const isModulePageLoad = visit.method === 'get' && !isSamePath;

    return (
        visit.showProgress &&
        !visit.async &&
        !visit.prefetch &&
        !isPartialReload &&
        isModulePageLoad
    );
}

export function GlobalLoader() {
    const [isVisible, setIsVisible] = useState(false);
    const startedAt = useRef<number | null>(null);
    const showTimer = useRef<number | null>(null);
    const hideTimer = useRef<number | null>(null);

    useEffect(() => {
        const clearShowTimer = () => {
            if (showTimer.current) {
                window.clearTimeout(showTimer.current);
                showTimer.current = null;
            }
        };

        const clearHideTimer = () => {
            if (hideTimer.current) {
                window.clearTimeout(hideTimer.current);
                hideTimer.current = null;
            }
        };

        const hideLoader = () => {
            clearShowTimer();

            if (!startedAt.current) {
                return;
            }

            const elapsed = Date.now() - startedAt.current;
            const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

            clearHideTimer();
            hideTimer.current = window.setTimeout(() => {
                startedAt.current = null;
                setIsVisible(false);
            }, remaining);
        };

        const showLoader = (delay = LOADER_DELAY_MS) => {
            clearShowTimer();
            clearHideTimer();

            showTimer.current = window.setTimeout(() => {
                startedAt.current = Date.now();
                setIsVisible(true);
            }, delay);
        };

        const handleModuleLinkClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const moduleLink = (event.target as Element | null)?.closest(
                MODULE_LINK_SELECTOR,
            );

            if (!(moduleLink instanceof HTMLAnchorElement)) {
                return;
            }

            const targetUrl = new URL(moduleLink.href);
            const isSamePath =
                targetUrl.origin === window.location.origin &&
                targetUrl.pathname === window.location.pathname;

            if (targetUrl.origin !== window.location.origin || isSamePath) {
                return;
            }

            showLoader(0);
        };

        document.addEventListener('click', handleModuleLinkClick, true);

        const removeStartListener = router.on(
            'start',
            (event: GlobalEvent<'start'>) => {
                if (!shouldShowGlobalLoader(event.detail.visit)) {
                    return;
                }

                showLoader();
            },
        );

        const removeFinishListener = router.on(
            'finish',
            (event: GlobalEvent<'finish'>) => {
                if (
                    event.detail.visit.completed ||
                    event.detail.visit.cancelled ||
                    event.detail.visit.interrupted
                ) {
                    hideLoader();
                }
            },
        );

        return () => {
            clearShowTimer();
            clearHideTimer();
            document.removeEventListener('click', handleModuleLinkClick, true);
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            aria-live="polite"
            aria-busy="true"
            className="fixed inset-0 z-[100] grid place-items-center bg-background/35 p-6 backdrop-blur-[2px]"
            role="status"
        >
            <div className="glass-elevated flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl px-8 py-7 text-center shadow-2xl">
                <div className="grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    <LoaderCircle
                        aria-hidden="true"
                        className="size-7 animate-spin"
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                        Loading module
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Preparing your workspace...
                    </p>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
                </div>
            </div>
        </div>
    );
}
