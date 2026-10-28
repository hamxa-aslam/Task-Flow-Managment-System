import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';

const MENU_GAP = 8;
const MENU_PADDING = 8;
const OPTION_HEIGHT = 58;
const MENU_MAX_HEIGHT = 280;

export default function RoleSelect({
  ariaLabel,
  buttonClassName = '',
  disabled = false,
  id,
  menuMinWidth = 200,
  onChange,
  options,
  title,
  value,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();

  const selected = options.find((option) => option.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = Math.min(MENU_MAX_HEIGHT, options.length * OPTION_HEIGHT + MENU_PADDING * 2);
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableHeight = openUp ? spaceAbove : spaceBelow;
    const height = Math.max(0, Math.min(menuHeight, availableHeight));
    const top = openUp
      ? Math.max(MENU_GAP, rect.top - height - MENU_GAP)
      : rect.bottom + MENU_GAP;
    const width = Math.max(rect.width, menuMinWidth);
    const left = Math.max(
      MENU_GAP,
      Math.min(rect.left, window.innerWidth - width - MENU_GAP),
    );

    setPosition({ height, left, top, width });
  }, [menuMinWidth, options.length]);

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);

    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;

    setActiveIndex(selectedIndex);
    updatePosition();
    setOpen(true);
  }, [disabled, selectedIndex, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      close();
    };

    const handleReposition = () => updatePosition();
    const handleResize = () => close();

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [close, open, updatePosition]);

  const choose = (option) => {
    if (!option) return;

    if (option.value !== value) {
      onChange(option.value);
    }

    close(true);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!open) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        openMenu();
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }

    if (event.key === 'Tab') {
      close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(options[activeIndex]);
    }
  };

  return (
    <>
      <button
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`flex items-center justify-between gap-2 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-indigo-500/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 ${buttonClassName}`}
        disabled={disabled}
        id={id}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        title={title}
        type="button"
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
          {selected?.label ?? 'Select role'}
        </span>
        <Icon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-indigo-500' : ''
          }`}
          name="chevronDown"
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            aria-label={ariaLabel}
            className="animate-menu-in fixed z-[100] overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-2xl shadow-slate-950/15 ring-1 ring-slate-900/5"
            id={listboxId}
            ref={menuRef}
            role="listbox"
            style={{
              left: position.left,
              maxHeight: position.height,
              top: position.top,
              width: position.width,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  aria-selected={isSelected}
                  className={`group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 active:text-indigo-700 ${
                    isActive || isSelected
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-700'
                  }`}
                  id={`${listboxId}-option-${index}`}
                  key={option.value}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{option.label}</span>
                    {option.description && (
                      <span
                        className={`mt-0.5 block truncate text-[11px] font-medium ${
                          isActive || isSelected
                            ? 'text-indigo-400'
                            : 'text-slate-400 group-hover:text-indigo-400'
                        }`}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                      name="check"
                      strokeWidth={2.4}
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
