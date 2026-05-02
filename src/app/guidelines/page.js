import { ShieldCheck, Info, FileTextIcon, Flame } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">Community Guidelines</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Picify is a place for discovering and sharing inspiration. We protect this space by enforcing guidelines that keep our community safe, positive, and creative.
        </p>
      </div>

      <div className="grid gap-8">
        <section className="glass-card rounded-3xl p-8 border border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Be Inspired, Be Respectful
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We encourage users to save and share what they love, but we do not tolerate content that promotes hatred, violence, or discrimination. Be kind to other creators in the comments.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>No hate speech or targeted harassment</li>
            <li>No promotion of violence or self-harm</li>
            <li>No deliberate spread of misinformation</li>
          </ul>
        </section>

        <section className="glass-card rounded-3xl p-8 border border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-500" />
            Adult Content & NSFW
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Picify uses AI to detect Not Safe For Work (NSFW) imagery. We do not allow sexually explicit content, non-consensual imagery, or graphic violence.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Content flagged by our automated systems may be hidden from the explore feed, marked private, or removed entirely by our moderation team.
          </p>
        </section>

        <section className="glass-card rounded-3xl p-8 border border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileTextIcon className="w-6 h-6 text-green-500" />
            Spam & Automation
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Do not artificially boost engagement. Creating multiple accounts to like your own pins or using bots to leave generic comments is prohibited and will result in a ban.
          </p>
        </section>
      </div>

      <div className="mt-12 text-center p-8 bg-secondary/50 rounded-3xl flex flex-col items-center">
        <h3 className="text-xl font-bold mb-2">See something that breaks the rules?</h3>
        <p className="text-muted-foreground max-w-lg mb-6 text-sm">
          You can report pins, boards, comments, and users. Our moderation team reviews reports within 24 hours.
        </p>
        <Link href="/">
          <Button className="rounded-full px-8">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
