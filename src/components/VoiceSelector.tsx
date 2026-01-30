import { Mic } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VOICE_OPTIONS, type VoiceOption } from '@/hooks/useVoicePreference';

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
  const currentVoice = VOICE_OPTIONS.find(v => v.id === selectedVoiceId) || VOICE_OPTIONS[0];
  
  const maleVoices = VOICE_OPTIONS.filter(v => v.gender === 'male');
  const femaleVoices = VOICE_OPTIONS.filter(v => v.gender === 'female');

  const VoiceItem = ({ voice }: { voice: VoiceOption }) => (
    <button
      onClick={() => onVoiceChange(voice.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
        selectedVoiceId === voice.id
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted text-foreground'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${
        selectedVoiceId === voice.id ? 'bg-primary' : 'bg-muted-foreground/30'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          selectedVoiceId === voice.id ? 'text-primary' : 'text-foreground'
        }`}>
          {voice.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {voice.description}
        </p>
      </div>
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
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
        className="w-56 p-2 bg-popover border border-border shadow-lg" 
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
            <VoiceItem key={voice.id} voice={voice} />
          ))}
        </div>
        
        {/* Female voices */}
        <div>
          <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Female Voices
          </p>
          {femaleVoices.map(voice => (
            <VoiceItem key={voice.id} voice={voice} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
