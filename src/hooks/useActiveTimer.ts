import { useEffect, useState } from "react";

interface UseActiveTimerProps {
    minDuration: number;
    active: boolean;
}

export const useActiveTimer = ({ minDuration, active }: UseActiveTimerProps) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [active]);

    return { elapsed, completed: elapsed >= minDuration };
};
