'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, Volume2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useAISettings } from "@/context/AISettingsContext"
import { useState } from "react"

export default function AISettingsPopover() {
  const { config, updateConfig } = useAISettings();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border p-2 text-sm hover:bg-accent/50"
        >
          <Settings className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">Voice Mode</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Enable voice responses</span>
              </div>
              <Switch
                checked={config.voiceMode}
                onCheckedChange={(checked) => updateConfig({ voiceMode: checked })}
              />
            </div>
          </div>

          {config.voiceMode && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Speed</span>
                  <span className="text-sm text-muted-foreground">{config.voiceSpeed}x</span>
                </div>
                <Slider
                  value={[config.voiceSpeed]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => updateConfig({ voiceSpeed: value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pitch</span>
                  <span className="text-sm text-muted-foreground">{config.voicePitch}x</span>
                </div>
                <Slider
                  value={[config.voicePitch]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => updateConfig({ voicePitch: value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Volume</span>
                  <span className="text-sm text-muted-foreground">{config.voiceVolume * 100}%</span>
                </div>
                <Slider
                  value={[config.voiceVolume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => updateConfig({ voiceVolume: value })}
                />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
