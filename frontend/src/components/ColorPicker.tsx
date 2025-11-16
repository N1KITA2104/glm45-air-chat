import { useState, useEffect } from 'react';
import './ColorPicker.css';

export interface ColorOption {
  value: string;
  name: string;
  color: string;
}

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: ColorOption[];
}

export const ColorPicker = ({ value, onChange, options }: ColorPickerProps) => {
  const isCustomColor = value && !options.find(opt => opt.value === value);
  const [customColor, setCustomColor] = useState(isCustomColor ? value : '#6c5ce7');

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handlePresetColorSelect = (presetValue: string) => {
    onChange(presetValue);
    // Reset custom color when preset is selected
    if (presetValue) {
      setCustomColor('#6c5ce7');
    }
  };

  // Sync customColor with value when it's a custom color
  useEffect(() => {
    if (isCustomColor && value) {
      setCustomColor(value);
    }
  }, [value, isCustomColor]);

  return (
    <div className="color-picker-wrapper">
      <div className="color-picker">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`color-picker__option ${value === option.value ? 'color-picker__option--selected' : ''}`}
            onClick={() => handlePresetColorSelect(option.value)}
            title={option.name}
            aria-label={option.name}
            style={{ '--color': option.color } as React.CSSProperties}
          >
            <span className="color-picker__swatch" />
            {value === option.value && (
              <svg
                className="color-picker__check"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 4L6 11L3 8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div className="color-picker__custom">
        <label htmlFor="custom-color-input" className="color-picker__custom-label">
          Custom Color
        </label>
        <div className="color-picker__custom-input-wrapper">
          <input
            id="custom-color-input"
            type="color"
            value={isCustomColor ? value : customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="color-picker__custom-color-input"
          />
          <input
            type="text"
            value={isCustomColor ? value : customColor}
            onChange={(e) => {
              const color = e.target.value;
              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                handleCustomColorChange(color);
              } else {
                setCustomColor(color);
              }
            }}
            onBlur={(e) => {
              const color = e.target.value;
              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                handleCustomColorChange(color);
              } else {
                setCustomColor(isCustomColor ? value : customColor);
              }
            }}
            placeholder="#6c5ce7"
            className="color-picker__custom-text-input"
          />
        </div>
      </div>
    </div>
  );
};

