import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag, Image as ImageIcon, ChevronRight } from 'lucide-react';

export type ReportContext = 'USER' | 'POST';

export type ReportType =
  | 'PORNOGRAPHY'
  | 'HARASSMENT'
  | 'OFFLINE_TRANSACTION'
  | 'FRAUD'
  | 'OTHER'
  | 'FLAMEBAITING'
  | 'ADVERTISING'
  | 'SPAM';

const USER_REPORT_TYPES: ReportType[] = ['PORNOGRAPHY', 'HARASSMENT', 'OFFLINE_TRANSACTION', 'FRAUD', 'OTHER'];
const POST_REPORT_TYPES: ReportType[] = ['FLAMEBAITING', 'PORNOGRAPHY', 'ADVERTISING', 'SPAM', 'OTHER'];

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PORNOGRAPHY: 'Pornography/Inappropriate',
  HARASSMENT: 'Harassment/Abuse',
  OFFLINE_TRANSACTION: 'Induced Offline Transaction',
  FRAUD: 'Fraudulent Behavior',
  OTHER: 'Other',
  FLAMEBAITING: 'Malicious Provocation',
  ADVERTISING: 'Advertising/Traffic Diversion',
  SPAM: 'Spam Content'
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  context?: ReportContext;
  onSubmit: (report: { type: ReportType; description: string; images: string[] }) => Promise<boolean>;
}

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl ${className}`}>
    {children}
  </div>
);

export const ReportModal = ({ isOpen, onClose, targetName, context = 'USER', onSubmit }: ReportModalProps) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'TYPE' | 'DETAILS'>('TYPE');

  const types = context === 'USER' ? USER_REPORT_TYPES : POST_REPORT_TYPES;

  const handleTypeSelect = (type: ReportType) => {
    setSelectedType(type);
    setStep('DETAILS');
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);

    try {
      const submitted = await onSubmit({
        type: selectedType,
        description,
        images
      });
      if (submitted) { reset(); onClose(); }
    } finally { setIsSubmitting(false); }
  };

  const reset = () => {
    setSelectedType(null);
    setDescription('');
    setImages([]);
    setStep('TYPE');
  };

  const handleImageUpload = () => {
    // Attachments are intentionally unavailable until the reporting API supports them.
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#1a0b2e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{context === 'USER' ? 'Report User' : 'Report Post'}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {step === 'TYPE' ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 px-1">Please select report type (Required)</p>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className="w-full p-4 flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98] group"
                      >
                        <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                          {REPORT_TYPE_LABELS[type]}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Type Badge */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStep('TYPE')}
                      className="text-[10px] font-bold text-purple-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Change Type
                    </button>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                      {REPORT_TYPE_LABELS[selectedType!]}
                    </span>
                  </div>

                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 px-1">Description (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide details about the violation..."
                      className="w-full min-h-[120px] p-4 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Evidence Upload */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 px-1">Evidence Screenshots (Optional)</label>
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                          <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {images.length < 4 && (
                        <button
                          onClick={handleImageUpload}
                          className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-1 group"
                        >
                          <ImageIcon className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                          <span className="text-[8px] font-bold text-gray-600 group-hover:text-purple-400 tracking-widest uppercase">Upload</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium px-1">Max 4 screenshots allowed</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
