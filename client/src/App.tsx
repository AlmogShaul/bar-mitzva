import React, { useState } from 'react';
import { VerseCard } from './components/VerseCard';
import { GroupedVerseCard } from './components/GroupedVerseCard';
import tora from './data/torah.json';
import './App.css';
import BarMitzvahParashaPage from "./components/BarMitzvahStart";
import parashaMap from "./parasha_map.json";
import { Pasuk } from './data/psukim';

function App() {
    const [selectedParasha, setSelectedParasha] = React.useState<any>(
        JSON.parse(localStorage.getItem("selectedParasha") || "null")
    );
    const [showGrouped, setShowGrouped] = useState(false); // State to toggle between views

    const onParashaSelected = (data: any) => {
        console.log("onParashaSelected", data);
        const date = new Date(data.civilBirth);
        const year = date.getFullYear();
        if (year > 1900 && data.parshiot?.length) {
            console.log(parashaMap);
            const parasha = parashaMap.find(
                (a) => a.english.toLowerCase() === data.parshiot[0].split(" ")[1].toLowerCase()
            );
            setSelectedParasha(parasha);
            localStorage.setItem("selectedParasha", JSON.stringify(parasha));
        }
    };

    const groupedPsukim = selectedParasha && tora && tora.filter(a => a.parasha.toLowerCase().replace("'", "") === selectedParasha.english.toLowerCase().replace("'", ""))
        .reduce((groups: Pasuk[][], pasuk, index) => {
            if (index % 3 === 0) groups.push([]);
            groups[groups.length - 1].push(pasuk);
            return groups;
        }, [] as Pasuk[][]);

    return (
        <div className="app">
            {selectedParasha ? (
                <div>
                    <header className="app-header">
                        <h1>פרויקט בר מצווה</h1>
                        <h4>Bar Mitzvah Torah Reading Practice</h4>
                        <h2>Your Parasha - <b>{selectedParasha.hebrew}</b></h2>
                        <button className="toggle-button" onClick={() => setShowGrouped(!showGrouped)}>
                            {showGrouped ? 'Show Single Verses' : 'Show Grouped Verses'}
                        </button>
                    </header>
                    <main className="verses-container">
                        {showGrouped
                            ? groupedPsukim.map((group:any, index:number) => (
                                <GroupedVerseCard key={index} psukim={group} />
                              ))
                            : tora
                                .filter(a => a.parasha.toLowerCase().replace("'", "") === selectedParasha.english.toLowerCase().replace("'", ""))
                                .map((pasuk) => (
                                    <VerseCard key={pasuk.id} pasuk={pasuk} />
                                ))}
                    </main>
                    <footer className="app-footer">
                        <p>תרגול קריאת התורה / Torah Reading Practice</p>
                    </footer>
                </div>
            ) : (
                <BarMitzvahParashaPage onParashaSelected={onParashaSelected} />
            )}
        </div>
    );
}

export default App;