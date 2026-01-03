import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Hash, Volume2, Folder, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * ServerDataSelector - A searchable dropdown for roles, channels, categories, or emojis
 * 
 * @param {string} type - "role", "channel", "text_channel", "voice_channel", "category", "emoji"
 * @param {string} value - Currently selected ID
 * @param {function} onChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text
 * @param {string} guildId - The guild ID to fetch data for
 * @param {boolean} multiple - Allow multiple selections (returns array)
 */
export default function ServerDataSelector({ 
  type = "role", 
  value, 
  onChange, 
  placeholder = "Auswählen...",
  guildId,
  multiple = false,
  disabled = false,
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchServerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/guilds/${guildId}/server-data`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setServerData(res.data);
    } catch (e) {
      console.error("Failed to fetch server data:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (guildId && open && !serverData) {
      fetchServerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, open]);

  const items = useMemo(() => {
    if (!serverData) return [];

    switch (type) {
      case "role":
        return serverData.roles?.map(r => ({
          id: r.id,
          name: r.name,
          color: r.color,
          icon: <CircleDot className="h-4 w-4" style={{ color: r.color !== "#000000" ? r.color : "#99AAB5" }} />,
        })) || [];
      
      case "channel":
        return serverData.channels?.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.type === "voice" ? <Volume2 className="h-4 w-4 text-gray-400" /> : <Hash className="h-4 w-4 text-gray-400" />,
        })) || [];
      
      case "text_channel":
        return serverData.channels?.filter(c => c.type === "text").map(c => ({
          id: c.id,
          name: c.name,
          icon: <Hash className="h-4 w-4 text-gray-400" />,
        })) || [];
      
      case "voice_channel":
        return serverData.channels?.filter(c => c.type === "voice").map(c => ({
          id: c.id,
          name: c.name,
          icon: <Volume2 className="h-4 w-4 text-gray-400" />,
        })) || [];
      
      case "category":
        return serverData.categories?.map(c => ({
          id: c.id,
          name: c.name,
          icon: <Folder className="h-4 w-4 text-gray-400" />,
        })) || [];
      
      case "emoji":
        return serverData.emojis?.map(e => ({
          id: e.id,
          name: e.name,
          icon: <img src={e.url} alt={e.name} className="h-4 w-4" />,
        })) || [];
      
      default:
        return [];
    }
  }, [serverData, type]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return items.find(item => item.id === value);
  }, [items, value]);

  const selectedItems = useMemo(() => {
    if (!multiple || !Array.isArray(value)) return [];
    return items.filter(item => value.includes(item.id));
  }, [items, value, multiple]);

  const handleSelect = (itemId) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(itemId)) {
        onChange(current.filter(id => id !== itemId));
      } else {
        onChange([...current, itemId]);
      }
    } else {
      onChange(itemId === value ? "" : itemId);
      setOpen(false);
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) return selectedItems[0].name;
      return `${selectedItems.length} ausgewählt`;
    }
    return selectedItem?.name || placeholder;
  };

  const typeLabels = {
    role: "Rolle",
    channel: "Kanal",
    text_channel: "Textkanal",
    voice_channel: "Sprachkanal",
    category: "Kategorie",
    emoji: "Emoji",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !guildId}
          className={cn(
            "w-full justify-between bg-[#1E1F22] border-none text-white hover:bg-[#404249] hover:text-white",
            !value && "text-gray-400",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedItem?.icon}
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#2B2D31] border-[#1E1F22]" style={{ maxHeight: '400px' }}>
        <Command className="bg-transparent">
          <CommandInput 
            placeholder={`${typeLabels[type]} suchen...`} 
            className="bg-transparent border-none text-white"
          />
          <CommandList className="max-h-[300px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#5865F2 #2B2D31' }}
          >
            <CommandEmpty className="text-gray-400 text-sm py-6 text-center">
              {loading ? "Lädt..." : serverData ? `Keine ${typeLabels[type]} gefunden` : "Daten werden geladen..."}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item.id)}
                  className="text-white hover:bg-[#404249] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      multiple 
                        ? (Array.isArray(value) && value.includes(item.id) ? "opacity-100 text-[#5865F2]" : "opacity-0")
                        : (value === item.id ? "opacity-100 text-[#5865F2]" : "opacity-0")
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Quick selectors for common use cases
 */
export function RoleSelector(props) {
  return <ServerDataSelector type="role" {...props} />;
}

export function TextChannelSelector(props) {
  return <ServerDataSelector type="text_channel" {...props} />;
}

export function VoiceChannelSelector(props) {
  return <ServerDataSelector type="voice_channel" {...props} />;
}

export function CategorySelector(props) {
  return <ServerDataSelector type="category" {...props} />;
}

export function EmojiSelector(props) {
  return <ServerDataSelector type="emoji" {...props} />;
}
