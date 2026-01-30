import { useState } from 'react';
import { Mic, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VOICE_OPTIONS, type VoiceOption } from '@/hooks/useVoicePreference';

interface VoiceItemProps {
  voice: VoiceOption;
  isSelected: boolean;
  onSelect: (voiceId: string) => void;
}

const VoiceItem = ({ voice, isSelected, onSelect }: VoiceItemProps) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onSelect(voice.id);
    }}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
      isSelected
        ? 'bg-primary/10 text-primary'
        : 'text-foreground hover:bg-muted'
    }`}
  >
    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
      isSelected ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
    }`}>
      {isSelected && <Check className="w-2.5 h-2.5" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${
        isSelected ? 'text-primary' : 'text-foreground'
      }`}>
        {voice.name}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {voice.description}
      </p>
    </div>
  </button>
);

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
}

export const VoiceSelector = ({
  selectedVoiceId,
  onVoiceChange,
  disabled = false,
}: VoiceSelectorProps) => {
  const [open, setOpen] = useState(false);
  const currentVoice = VOICE_OPTIONS.find(v => v.id === selectedVoiceId) || VOICE_OPTIONS[0];
  
  const maleVoices = VOICE_OPTIONS.filter(v => v.gender === 'male');
  const femaleVoices = VOICE_OPTIONS.filter(v => v.gender === 'female');

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {currentVoice.name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 bg-popover border border-border shadow-lg z-[100]" 
        align="end"
        sideOffset={8}
      >
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Choose Voice
        </p>
        
        {/* Male voices */}
        <div className="mb-2">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Male Voices
          </p>
          {maleVoices.map(voice => (
            <VoiceItem 
              key={voice.id} 
              voice={voice} 
              isSelected={selectedVoiceId === voice.id}
              onSelect={handleVoiceSelect}
            />
          ))}
        </div>
        
        {/* Female voices */}
        <div>
          <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Female Voices
          </p>
          {femaleVoices.map(voice => (
            <VoiceItem 
              key={voice.id} 
              voice={voice} 
              isSelected={selectedVoiceId === voice.id}
              onSelect={handleVoiceSelect}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
