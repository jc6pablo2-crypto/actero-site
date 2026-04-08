import React, { useState } from 'react'
import { X, LogOut, ChevronDown } from 'lucide-react'
import { Logo } from './Logo'

export const Sidebar = ({
  title = "Actero",
  items = [],
  activeTab,
  setActiveTab,
  onLogout,
  isOpen: _isOpen,
  onClose,
  theme = "light"
}) => {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="w-full md:w-[260px] flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="h-16 flex items-center px-5 justify-between md:justify-start border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Logo className="w-7 h-7 text-[#003725]" />
          <span className="font-bold text-[17px] text-[#262626] tracking-tight">{title}</span>
        </div>
        <button
          className="md:hidden text-[#716D5C] hover:text-[#262626]"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={idx} className="px-3 pt-6 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#716D5C]/70">
                  {item.label}
                </p>
              </div>
            );
          }

          // Expandable section with children
          if (item.type === 'expandable') {
            const isExpanded = expandedSections[item.label] ?? item.defaultOpen ?? false
            const hasActiveChild = (item.children || []).some(c => c.id === activeTab)
            return (
              <div key={idx}>
                <button
                  onClick={() => toggleSection(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    hasActiveChild
                      ? "text-[#262626] bg-[#F9F7F1]"
                      : "text-[#716D5C] hover:bg-[#F9F7F1] hover:text-[#262626]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon && <item.icon className="w-[18px] h-[18px]" />}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-gray-100 space-y-0.5 mt-0.5 mb-1">
                    {(item.children || []).map(child => {
                      const isActive = activeTab === child.id
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            setActiveTab(child.id)
                            if (onClose) onClose()
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 ${
                            isActive
                              ? "bg-[#003725] text-white shadow-sm"
                              : "text-[#716D5C] hover:bg-[#F9F7F1] hover:text-[#262626]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {child.icon && <child.icon className={`w-[15px] h-[15px] ${isActive ? 'text-white/80' : ''}`} />}
                            <span>{child.label}</span>
                          </div>
                          {child.badge && (
                            <span className={`min-w-[18px] text-center py-0.5 px-1 rounded-md text-[9px] font-bold ${
                              isActive ? "bg-white/20 text-white" : (child.badgeColor || "bg-gray-100 text-[#716D5C]")
                            }`}>
                              {child.badge}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#003725] text-white shadow-sm"
                  : "text-[#716D5C] hover:bg-[#F9F7F1] hover:text-[#262626]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon && <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-white/80' : ''}`} />}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`min-w-[20px] text-center py-0.5 px-1.5 rounded-md text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : (item.badgeColor || "bg-gray-100 text-[#716D5C]")
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-[#716D5C] hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-[18px] h-[18px]" /> Deconnexion
        </button>
      </div>
    </div>
  );
};
