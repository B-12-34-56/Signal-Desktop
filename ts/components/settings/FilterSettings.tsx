import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import classNames from 'classnames';
import { getIntl } from '../../util/getIntl';

export type FilterSettingsProps = {
  onClose?: () => void;
  className?: string;
};

export const FilterSettings = ({ onClose, className }: FilterSettingsProps): JSX.Element => {
  const i18n = getIntl();
  const [isEnabled, setIsEnabled] = useState(false);
  const [useGlobalDatabase, setUseGlobalDatabase] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(90);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Initialize from localStorage and FilterService
  useEffect(() => {
    const loadSettings = () => {
      const savedEnabled = localStorage.getItem('filterEnabled') === 'true';
      const savedGlobal = localStorage.getItem('filterUseGlobal') === 'true';
      const savedThreshold = Number(localStorage.getItem('filterThreshold') || '90');

      setIsEnabled(savedEnabled);
      setUseGlobalDatabase(savedGlobal);
      setSimilarityThreshold(savedThreshold);

      if (window.Signal?.Services?.filterService) {
        window.Signal.Services.filterService.isEnabled = savedEnabled;
        window.Signal.Services.filterService.isGlobalEnabled = savedGlobal;
        window.Signal.Services.filterService.similarityThreshold = savedThreshold;
      }
    };

    loadSettings();
  }, []);

  const handleSave = () => {
    localStorage.setItem('filterEnabled', isEnabled.toString());
    localStorage.setItem('filterUseGlobal', useGlobalDatabase.toString());
    localStorage.setItem('filterThreshold', similarityThreshold.toString());

    if (window.Signal?.Services?.filterService) {
      window.Signal.Services.filterService.isEnabled = isEnabled;
      window.Signal.Services.filterService.isGlobalEnabled = useGlobalDatabase;
      window.Signal.Services.filterService.similarityThreshold = similarityThreshold;
    }

    onClose?.();
  };

  const handleReset = () => {
    const defaults = window.Signal?.Services?.filterService?.DEFAULT_SETTINGS || {
      enabled: false,
      global: false,
      threshold: 90
    };

    setIsEnabled(defaults.enabled);
    setUseGlobalDatabase(defaults.global);
    setSimilarityThreshold(defaults.threshold);
    setShowResetDialog(false);
  };

  return (
    <div className={classNames('FilterSettings', className)}>
      <div className="FilterSettings__section">
        <h2>{i18n('icu:contentFilter__title')}</h2>

        <div className="FilterSettings__option">
          <label className="FilterSettings__label">
            {i18n('icu:contentFilter__enableLabel')}
            <Switch.Root
              className="FilterSettings__switch"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            >
              <Switch.Thumb className="FilterSettings__switch-thumb" />
            </Switch.Root>
          </label>
          <p className="FilterSettings__description">
            {i18n('icu:contentFilter__enableDescription')}
          </p>
        </div>

        {isEnabled && (
          <>
            <div className="FilterSettings__option">
              <label className="FilterSettings__label">
                {i18n('icu:contentFilter__globalDatabaseLabel')}
                <Switch.Root
                  className="FilterSettings__switch"
                  checked={useGlobalDatabase}
                  onCheckedChange={setUseGlobalDatabase}
                >
                  <Switch.Thumb className="FilterSettings__switch-thumb" />
                </Switch.Root>
              </label>
              <p className="FilterSettings__description">
                {i18n('icu:contentFilter__globalDatabaseDescription')}
              </p>
            </div>

            <div className="FilterSettings__option">
              <label className="FilterSettings__label">
                {i18n('icu:contentFilter__sensitivityLabel')}
                <div className="FilterSettings__slider-container">
                  <Slider.Root
                    className="FilterSettings__slider"
                    value={[similarityThreshold]}
                    onValueChange={([val]) => setSimilarityThreshold(val)}
                    min={50}
                    max={100}
                    step={5}
                  >
                    <Slider.Track className="FilterSettings__slider-track">
                      <Slider.Range className="FilterSettings__slider-range" />
                    </Slider.Track>
                    <Slider.Thumb className="FilterSettings__slider-thumb" />
                  </Slider.Root>
                  <span className="FilterSettings__slider-value">
                    {similarityThreshold}%
                  </span>
                </div>
              </label>
              <p className="FilterSettings__description">
                {i18n('icu:contentFilter__sensitivityDescription')}
              </p>
            </div>
          </>
        )}

        <div className="FilterSettings__actions">
          <button
            type="button"
            className="FilterSettings__reset-button"
            onClick={() => setShowResetDialog(true)}
          >
            {i18n('icu:resetToDefaults')}
          </button>
          <button
            type="button"
            className="FilterSettings__save-button"
            onClick={handleSave}
          >
            {i18n('icu:saveChanges')}
          </button>
        </div>
      </div>

      <AlertDialog.Root open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="FilterSettings__overlay" />
          <AlertDialog.Content className="FilterSettings__dialog">
            <AlertDialog.Title className="FilterSettings__dialog-title">
              {i18n('icu:contentFilter__resetConfirmTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="FilterSettings__dialog-description">
              {i18n('icu:contentFilter__resetConfirmText')}
            </AlertDialog.Description>
            <div className="FilterSettings__dialog-actions">
              <AlertDialog.Cancel asChild>
                <button className="FilterSettings__cancel-button">
                  {i18n('icu:cancel')}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="FilterSettings__confirm-button"
                  onClick={handleReset}
                >
                  {i18n('icu:reset')}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
};

export default FilterSettings;
