import * as Icons from "lucide-react";
import { ReactNode } from "react";

/**
 * Maps icon names from database to Lucide React icons
 */
export function getIconComponent(iconName: string, className?: string): ReactNode {
  if (!iconName) {
    const FallbackIcon = Icons.Settings;
    return <FallbackIcon className={className} />;
  }

  // Convert icon name to PascalCase if needed
  const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ className?: string }>;
  
  if (!IconComponent) {
    // Fallback to Settings icon if icon not found
    const FallbackIcon = Icons.Settings;
    return <FallbackIcon className={className} />;
  }
  
  return <IconComponent className={className} />;
}

/**
 * Get icon component by name (returns the component class, not an instance)
 */
export function getIcon(iconName: string | null | undefined): React.ComponentType<{ className?: string }> {
  if (!iconName) {
    return Icons.Settings;
  }

  const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ className?: string }>;
  return IconComponent || Icons.Settings;
}

