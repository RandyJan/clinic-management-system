import * as React from 'react';

import { cn } from '@/lib/utils';

type GlassPanelVariant = 'default' | 'subtle' | 'elevated' | 'interactive';

const glassPanelVariants: Record<GlassPanelVariant, string> = {
    default: 'glass-default',
    subtle: 'glass-subtle',
    elevated: 'glass-elevated',
    interactive: 'glass-default glass-interactive',
};

function GlassPanel({
    className,
    variant = 'default',
    ...props
}: React.ComponentProps<'div'> & {
    variant?: GlassPanelVariant;
}) {
    return (
        <div
            data-slot="glass-panel"
            className={cn(
                'rounded-xl text-card-foreground',
                glassPanelVariants[variant],
                className,
            )}
            {...props}
        />
    );
}

export { GlassPanel, glassPanelVariants };
