import React from 'react'
import { X, LogOut } from 'lucide-react'
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
  return (
    <div className="w-full md:w-64 flex flex-col h-full border-r bg-white border-gray-200">
      <div className="h-16 flex items-center px-6 border-b justify-between md:justify-start border-gray-200">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-[#003725]" />
          <span className="font-bold text-lg text-[#262626]">{title}</span>
        </div>
        <button
          className="md:hidden text-[#716D5C] hover:text-[#262626]"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {items.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={idx} className="px-3 text-[10px] font-bold uppercase tracking-widest mb-3 mt-6 text-[#716D5C]">
                {item.label}
              </div>
            );
          }

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#003725]/10 text-[#003725]"
                  : "text-[#716D5C] hover:bg-gray-50 hover:text-[#262626]"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </div>
              {item.badge && (
                <span className={`py-0.5 px-2 rounded-full text-[10px] font-bold ${
                  item.badgeColor || "bg-gray-100 text-[#716D5C]"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-[#716D5C] hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </div>
  );
};
