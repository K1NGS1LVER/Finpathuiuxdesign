import { motion } from "motion/react";
import { Award, ArrowDown } from "lucide-react";
import type { Milestone } from "@/lib/types";
import { cardEntry } from "@/app/components/motion-variants";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { computeLevel } from "@/lib/levels";

interface Props {
  milestones: Milestone[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function MilestoneChain({ milestones }: Props) {
  const reduced = useReducedMotion();
  const totalSparks = milestones.reduce((sum, m) => sum + m.sparks, 0);
  const level = computeLevel(totalSparks);

  if (milestones.length === 0) {
    return (
      <div
        className="bento-card text-center"
        style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <Award
          size={40}
          className="mx-auto mb-3"
          style={{ color: "var(--secondary)", opacity: 0.5 }}
        />
        <div
          className="font-semibold mb-1 text-[var(--card-foreground)]"
          style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-display)" }}
        >
          No milestones minted yet
        </div>
        <div
          className="text-[var(--secondary)]"
          style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-body)" }}
        >
          Complete a goal to add the first block to your chain.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header: level + total sparks */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "var(--space-3)" }}
      >
        <div>
          <div
            className="text-[var(--secondary)] uppercase tracking-wider"
            style={{
              fontSize: "var(--text-2xs)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.08em",
            }}
          >
            Achievement Ledger
          </div>
          <div
            className="font-bold text-[var(--card-foreground)]"
            style={{ fontSize: "var(--text-xl)", fontFamily: "var(--font-display)" }}
          >
            {level.label}
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 pill"
          style={{
            background: "var(--surface-tint)",
            border: "1px solid var(--border)",
            color: "var(--accent-text)",
            fontSize: "var(--text-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--font-weight-semibold)",
          }}
        >
          <Award size={14} style={{ color: "var(--accent)" }} />
          {totalSparks.toLocaleString("en-IN")} sparks
        </div>
      </div>

      {/* Chain */}
      <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
        {milestones.map((m, i) => (
          <div key={m.id}>
            <motion.div
              className="bento-card relative overflow-hidden"
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
              variants={cardEntry}
              initial={reduced ? false : "initial"}
              animate="animate"
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      background: "var(--accent)",
                      color: "var(--on-accent)",
                    }}
                  >
                    <Award size={18} />
                  </div>
                  <div>
                    <div
                      className="font-semibold text-[var(--card-foreground)]"
                      style={{ fontSize: "var(--text-base)", fontFamily: "var(--font-display)" }}
                    >
                      {m.title}
                    </div>
                    <div
                      className="text-[var(--secondary)]"
                      style={{ fontSize: "var(--text-2xs)", fontFamily: "var(--font-body)" }}
                    >
                      {formatDate(m.completedAt)} · {m.category}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-bold slashed-zero"
                    style={{
                      fontSize: "var(--text-base)",
                      fontFamily: "var(--font-display)",
                      color: "var(--accent-text)",
                    }}
                  >
                    +{m.sparks.toLocaleString("en-IN")}
                  </div>
                  <div
                    className="text-[var(--secondary)] font-mono"
                    style={{ fontSize: "var(--text-2xs)", letterSpacing: "0.04em" }}
                    title={`prevHash: ${m.prevHash ?? "genesis"}`}
                  >
                    #{m.hash}
                  </div>
                </div>
              </div>
            </motion.div>
            {i < milestones.length - 1 && (
              <div
                className="flex justify-center"
                style={{ color: "var(--border)" }}
                aria-hidden="true"
              >
                <ArrowDown size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
