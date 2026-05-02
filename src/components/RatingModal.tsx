import { useState } from "react";
import { Star, X } from "lucide-react";
import { userApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RatingModal = ({ isOpen, onClose, onSuccess }: RatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            await userApi.submitRating({ rating, feedback });
            toast.success("Thank you for your feedback!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl shadow-black/20 border border-border/50 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold font-heading text-foreground mb-1">Rate HelloGenie</h2>
                        <p className="text-sm text-muted-foreground font-body">Please share your rating and feedback.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium font-body text-foreground mb-4">How was your HelloGenie experience?</p>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    onClick={() => setRating(star)}
                                    className={`p-3 rounded-2xl border transition-all duration-200 ${(hover || rating) >= star
                                            ? "bg-primary/10 border-primary shadow-sm"
                                            : "bg-muted/50 border-border"
                                        }`}
                                >
                                    <Star
                                        size={24}
                                        className={`transition-all duration-200 ${(hover || rating) >= star
                                                ? "fill-primary text-primary"
                                                : "text-muted-foreground/40"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium font-body text-foreground mb-3">Additional feedback <span className="text-muted-foreground/60">(optional)</span></p>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us what helped today and what we can improve next time"
                            className="w-full h-32 px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-body outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/40"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-medium font-body hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                            className="flex-1 py-3.5 rounded-2xl bg-[#007EA7] text-white text-sm font-medium font-body hover:opacity-90 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isSubmitting ? "Submitting..." : "Rate"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
