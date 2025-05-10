import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { getIntl } from '../../util/getIntl';
import { FilterSettings } from './FilterSettings';

export type PropsType = {
  closeSettings: () => void;
};

export const SettingsView = ({ closeSettings }: PropsType): JSX.Element => {
  const i18n = getIntl();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="SettingsView">
      <div className="SettingsView__header">
        <button 
          type="button" 
          onClick={closeSettings}
          aria-label={i18n('icu:close')}
          className="SettingsView__close-button"
        >
          <span className="SettingsView__close-icon" />
        </button>
        <h1>{i18n('icu:settings')}</h1>
      </div>

      <div className="SettingsView__container">
        <nav className="SettingsView__navigation">
          <ul className="SettingsView__nav-list">
            <li className="SettingsView__nav-item">
              <a 
                href="#general" 
                className={`SettingsView__nav-link ${activeTab === 'general' ? 'SettingsView__nav-link--active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <svg className="SettingsView__nav-icon" viewBox="0 0 24 24">
                  <path d="M12 15.5c1.93 0 3.5-1.57 3.5-3.5S13.93 8.5 12 8.5 8.5 10.07 8.5 12s1.57 3.5 3.5 3.5zm0-5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM19.43 12.97c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65c-.03-.24-.24-.42-.49-.42h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1.01c.23.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
                </svg>
                {i18n('icu:settingsGeneral')}
              </a>
            </li>
            <li className="SettingsView__nav-item">
              <a 
                href="#content-filter" 
                className={`SettingsView__nav-link ${activeTab === 'filter' ? 'SettingsView__nav-link--active' : ''}`}
                onClick={() => setActiveTab('filter')}
              >
                <svg className="SettingsView__filter-icon" viewBox="0 0 24 24">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
                {i18n('icu:contentFilter__title')}
              </a>
            </li>
            <li className="SettingsView__nav-item">
              <a 
                href="#privacy" 
                className={`SettingsView__nav-link ${activeTab === 'privacy' ? 'SettingsView__nav-link--active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <svg className="SettingsView__nav-icon" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                {i18n('icu:settingsPrivacy')}
              </a>
            </li>
          </ul>
        </nav>

        <div className="SettingsView__content">
          {activeTab === 'filter' && (
            <FilterSettings 
              onClose={closeSettings}
              className="SettingsView__filter-section"
            />
          )}
          {activeTab === 'general' && (
            <div className="SettingsView__general-section">
              <h2>{i18n('icu:settingsGeneral')}</h2>
              {/* General settings content would go here */}
            </div>
          )}
          {activeTab === 'privacy' && (
            <div className="SettingsView__privacy-section">
              <h2>{i18n('icu:settingsPrivacy')}</h2>
              {/* Privacy settings content would go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;