import React, { useState, useEffect } from 'react';
import * as SwitchPrimitives from "@radix-ui/react-switch";
import classNames from 'classnames';
import { i18n } from '../../context/i18n';

export type Props = {
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export const AttachmentFilterToggle = ({
  isEnabled,
  onToggle,
  disabled = false,
  className,
}: Props): JSX.Element => {
  const [enabled, setEnabled] = useState(isEnabled);

  useEffect(() => {
    const saved = window.localStorage.getItem('attachmentFilterEnabled');
    if (saved !== null) {
      setEnabled(saved === 'true');
      onToggle(saved === 'true');
    }
  }, []);

  useEffect(() => {
    if (!window.Signal?.Services?.filterService) return;
    
    const updateFromService = () => {
      const serviceEnabled = window.Signal.Services.filterService.isEnabled;
      if (enabled !== serviceEnabled) {
        setEnabled(serviceEnabled);
        onToggle(serviceEnabled);
      }
    };

    window.Signal.Services.filterService.addEventListener('change', updateFromService);
    return () => {
      window.Signal.Services.filterService.removeEventListener('change', updateFromService);
    };
  }, [enabled, onToggle]);

  const handleToggle = (newValue: boolean) => {
    setEnabled(newValue);
    onToggle(newValue);
    window.localStorage.setItem('attachmentFilterEnabled', newValue.toString());
  };

  return (
    <div className={classNames('AttachmentFilterToggle', className)}>
      <SwitchPrimitives.Root
        className={classNames(
          'SwitchRoot',
          enabled && 'SwitchRoot--active',
          disabled && 'SwitchRoot--disabled'
        )}
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={disabled}
        aria-label={i18n('icu:attachmentFilterToggleLabel')}
      >
        <SwitchPrimitives.Thumb className="SwitchThumb" />
      </SwitchPrimitives.Root>
      <span className="SwitchLabel">
        {enabled 
          ? i18n('icu:filterEnabled') 
          : i18n('icu:filterDisabled')}
      </span>
      <div className="FilterIconContainer">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={classNames('FilterIcon', enabled && 'FilterIcon--active')}
        >
          <path
            fill="currentColor"
            d="M14 1.5C14 1.22386 13.7761 1 13.5 1H2.5C2.22386 1 2 1.22386 2 1.5V4.80902C2 4.90758 2.02727 5.00435 2.07868 5.08854L5.5 10.7175V14.5C5.5 14.6881 5.65162 14.846 5.83927 14.8636C5.85471 14.8652 5.87024 14.866 5.88583 14.866C6.03929 14.866 6.18214 14.7841 6.25736 14.648L7.74264 12.102C7.81925 11.9633 7.81401 11.7924 7.72874 11.6585L4.69437 6.75H13.5C13.7761 6.75 14 6.52614 14 6.25V1.5ZM3 2H13V4.80902L13 4.88237L12.9931 4.95511L12.9213 5.08854L9.5 10.7175V12.799L8.5 14.134V10.75V10.633L8.44513 10.533L5.55487 5.46701L5.5 5.36699V5.25V2H3Z"
          />
        </svg>
      </div>
    </div>
  );
};

export default AttachmentFilterToggle;