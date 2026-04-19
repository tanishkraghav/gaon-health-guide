import { useSession } from "@/lib/session";
import { dict, t, type LangCode } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  k: keyof typeof dict;
  className?: string;
  englishClassName?: string;
  showEnglish?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

export function BilingualText({ k, className, englishClassName, showEnglish = true, as: Tag = "span" }: Props) {
  const { lang } = useSession();
  const primary = t(k, lang);
  const en = t(k, "en");
  const sameAsEnglish = lang === "en";
  return (
    <Tag className={cn("inline-block", className)}>
      <span>{primary}</span>
      {showEnglish && !sameAsEnglish && (
        <span className={cn("block text-[0.85em] opacity-70 font-normal", englishClassName)}>{en}</span>
      )}
    </Tag>
  );
}

export function bi(k: keyof typeof dict, lang: LangCode) {
  return { primary: t(k, lang), english: t(k, "en") };
}
