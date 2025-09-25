import React, { useEffect, useMemo, useState } from "react";
import { HDate, HebrewCalendar } from "@hebcal/core";

// Helper: next Shabbat (Saturday) on or after a given civil date
function nextShabbatOnOrAfter(d: Date): Date {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay(); // 0=Sun..6=Sat in UTC
  const delta = (6 - day + 7) % 7; // days until Saturday
  date.setUTCDate(date.getUTCDate() + delta);
  return date;
}

// Helper: formatters
const fmtCivil = (d?: Date) =>
    d
        ? d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })
        : "";

const fmtHebrew = (h?: HDate) => (h ? h.renderGematriya() : "");

// Safely build an HDate for the same Hebrew day/month, +13 years
function addHebrewYears(h: HDate, years: number): HDate {
  // HDate constructor signature: new HDate(day, month, year)
  // Month is a number 1..13 from `months` enum
  const day = h.getDate();
  const month = h.getMonth();
  const year = h.getFullYear() + years; // Hebrew year
  return new HDate(day, month, year);
}

// Extract Parasha events ("Parashat X") from a single-day Hebcal event list
function getParshiotOnDate(date: Date, il: boolean): string[] {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    il, // Israel schedule if true
    sedrot: true, // include weekly parasha (“sedra”) events
  });
  return events
      .map((e) => e.getDesc?.() || "")
      .filter((desc) => desc.startsWith("Parashat "));
}

// Fallback: if no parasha (e.g., a festival overrides), show that day's descriptions
function getOtherReadingDescription(date: Date, il: boolean): string[] {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    il,
    sedrot: true,
  });

  const descs = events.map((e) => e.getDesc?.() || "");
  // Remove candle-lighting/havdalah/etc noise
  return descs.filter(
      (d) =>
          d &&
          !d.toLowerCase().includes("candle") &&
          !d.toLowerCase().includes("havdalah") &&
          !d.toLowerCase().includes("omer") &&
          !d.startsWith("Parashat ")
  );
}

export default function BarMitzvahParashaPage({ onParashaSelected }: { onParashaSelected: (val: any) => void }) {
  const [birth, setBirth] = useState<string>("" || localStorage.getItem("birthDate") || ""); // Load from localStorage
  const [isIsrael, setIsIsrael] = useState<boolean>(false); // Diaspora default
  const [afterSunset, setAfterSunset] = useState<boolean>(false);

  useEffect(() => {
    if (birth) {
      localStorage.setItem("birthDate", birth); // Save to localStorage
    }
  }, [birth]);

  const result = useMemo(() => {
    try {
      if (!birth) return null;

      // Parse civil date from input as local date, normalize to UTC midnight
      const [y, m, d] = birth.split("-").map((s) => parseInt(s, 10));
      if (!y || !m || !d) return null;
      const civil = new Date(Date.UTC(y, m - 1, d));

      // Approximation for “born after sunset”: Hebrew date advances by one day
      const civilForHebrew = new Date(civil);
      if (afterSunset) civilForHebrew.setUTCDate(civilForHebrew.getUTCDate() + 1);

      // Hebrew birth date
      const hebBirth = new HDate(civilForHebrew);

      // Hebrew bar mitzvah date = same Hebrew day/month in +13 years
      const hebBM = addHebrewYears(hebBirth, 13);
      const civilBM = hebBM.greg();

      // Shabbat on/after the Hebrew bar mitzvah civil date
      const shabbat = nextShabbatOnOrAfter(civilBM);

      // Determine parasha (Israel vs Diaspora)
      const parshiot = getParshiotOnDate(shabbat, isIsrael);
      const otherReading = parshiot.length === 0 ? getOtherReadingDescription(shabbat, isIsrael) : [];

      return {
        civilBirth: civil,
        hebBirth,
        hebBM,
        civilBM,
        shabbat,
        parshiot,
        otherReading,
      };
    } catch (e) {
      console.error(e);
      return { error: (e as Error).message } as const;
    }
  }, [birth, isIsrael, afterSunset]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 text-gray-900">
      <div className="max-w-2xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center text-blue-700">Bar Mitzvah Parasha Finder</h1>
          <p className="text-lg text-gray-600 text-center">
            Enter a birth date and we’ll calculate the parasha for the bar mitzvah Shabbat using @hebcal/core.
          </p>
        </header>

        <div className="grid gap-4 bg-white rounded-2xl shadow-lg p-6">
          <label className="grid gap-2">
            <span className="text-lg font-medium">Birth date</span>
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => onParashaSelected(result)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Calculate
            </button>
          </label>

          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={afterSunset}
                onChange={(e) => setAfterSunset(e.target.checked)}
                className="focus:ring-blue-500"
              />
              <span className="text-lg">Born after sunset</span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isIsrael}
                onChange={(e) => setIsIsrael(e.target.checked)}
                className="focus:ring-blue-500"
              />
              <span className="text-lg">Follow Israel schedule</span>
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {!birth ? (
            <p className="text-gray-600 text-center">Fill in the birth date to see results.</p>
          ) : result && "error" in result ? (
            <div className="text-red-600 text-center">Error: {result.error}</div>
          ) : result ? (
            <div className="grid gap-4 bg-white rounded-2xl shadow-lg p-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Key dates</h2>
                <ul className="text-lg grid gap-2">
                  <li>
                    <span className="font-medium">Hebrew birth date:</span> {fmtHebrew(result.hebBirth)}
                  </li>
                  <li>
                    <span className="font-medium">Hebrew bar mitzvah date (13 years later):</span> {fmtHebrew(result.hebBM)}
                  </li>
                  <li>
                    <span className="font-medium">Civil bar mitzvah date (Gregorian):</span> {fmtCivil(result.civilBM)}
                  </li>
                  <li>
                    <span className="font-medium">Bar mitzvah Shabbat:</span> {fmtCivil(result.shabbat)}
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Reading</h2>
                {result.parshiot.length > 0 ? (
                  <div className="text-lg">
                    <div className="mb-2">Weekly portion:</div>
                    <ul className="list-disc pl-5">
                      {result.parshiot.map((p) => (
                        <li key={p}>{p.replace("Parashat ", "")}</li>
                      ))}
                    </ul>
                    <div className="text-sm text-gray-500 mt-2">
                      ({isIsrael ? "Israel" : "Diaspora"} schedule)
                    </div>
                  </div>
                ) : (
                  <div className="text-lg">
                    <div className="mb-2">
                      This Shabbat coincides with a special reading (no regular weekly parasha).
                    </div>
                    {result.otherReading.length > 0 && (
                      <ul className="list-disc pl-5">
                        {result.otherReading.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      ({isIsrael ? "Israel" : "Diaspora"} schedule)
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
