interface BingoBoardProps {
    words: string[];
    checkedCells: boolean[];
    bingoCells?: number[];
    isMyTurn?: boolean;
    disabled?: boolean;
    onCellClick?: (word: string, index: number) => void;
}

export default function BingoBoard({
                                       words,
                                       checkedCells,
                                       bingoCells = [],
                                       isMyTurn = false,
                                       disabled = false,
                                       onCellClick,
                                   }: BingoBoardProps) {
    if (!words || words.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, width: '100%' }}>
            {words.map((word, i) => {
                const isChecked = checkedCells?.[i] ?? false;
                const isBingo   = bingoCells.includes(i);
                const clickable = isMyTurn && !isChecked && !disabled;

                return (
                    <div
                        key={i}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onClick={() => clickable && onCellClick?.(word, i)}
                        onKeyDown={(e) => e.key === 'Enter' && clickable && onCellClick?.(word, i)}
                        style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 10,
                            padding: 4,
                            textAlign: 'center',
                            fontSize: 'clamp(0.62rem, 1.8vw, 0.85rem)',
                            fontWeight: isChecked ? 700 : 400,
                            fontFamily: 'var(--font-body)',
                            cursor: clickable ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                            wordBreak: 'keep-all',
                            lineHeight: 1.3,
                            background: isBingo
                                ? 'linear-gradient(135deg, var(--accent-gold), #ff9f1c)'
                                : isChecked
                                    ? 'linear-gradient(135deg, var(--primary), #8b7cf8)'
                                    : 'var(--bg)',
                            color: isChecked || isBingo ? '#fff' : 'var(--text-1)',
                            border: isBingo
                                ? '2px solid rgba(255,209,102,0.8)'
                                : isChecked
                                    ? '1px solid var(--primary)'
                                    : '1px solid var(--border)',
                            boxShadow: isBingo
                                ? '0 0 12px rgba(255,209,102,0.5)'
                                : isChecked
                                    ? '0 0 8px rgba(108,99,255,0.35)'
                                    : 'none',
                            transform: isChecked ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                            if (clickable) {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.background  = 'rgba(108,99,255,0.12)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (clickable) {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.background  = 'var(--bg)';
                            }
                        }}
                    >
                        {isBingo && (
                            <div style={{
                                position: 'absolute', inset: 0, opacity: 0.15,
                                background: 'repeating-linear-gradient(45deg,#fff,#fff 2px,transparent 2px,transparent 8px)',
                            }} />
                        )}
                        <span style={{ position: 'relative', zIndex: 1 }}>{word}</span>
                    </div>
                );
            })}
        </div>
    );
}