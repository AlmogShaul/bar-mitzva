import React from 'react';
import { VerseCard } from './components/VerseCard';
import { psukim } from './data/psukim';
import './App.css';
import BarMitzvahParashaPage from "./components/BarMitzvahStart";
import parashaMap from "./parasha_map.json";
//aaaas
function App() {
    const [selectedParasha, setSelectedParasha] = React.useState<any>(
        localStorage.getItem("selectedParasha") || null
    );

    const onParashaSelected = (data: any) => {
        console.log("onParashaSelected", data);
        const date = new Date(data.civilBirth);
        const year = date.getFullYear();
        if (year > 1900 && data.parshiot?.length) {
            console.log(parashaMap);
            const parasha = parashaMap.find(
                (a) => a.english.toLowerCase() === data.parshiot[0].split(" ")[1].toLowerCase()
            );

            const selected = parasha?.hebrew || data.parshiot[0];
            setSelectedParasha(selected);
            localStorage.setItem("selectedParasha", selected);
        }
    }
  return (
    <div className="app">
        {selectedParasha ? <div>
                <header className="app-header">
                    <h1>פרויקט בר מצווה</h1>
                    <h4>Bar Mitzvah Torah Reading Practice</h4>
                    <h2>Your Parasha - <b> {selectedParasha}</b></h2>
                </header>
                <main className="verses-container">
                    {psukim.map((pasuk) => (
                        <VerseCard key={pasuk.id} pasuk={pasuk} />
                    ))}
                </main>
                <div>
                    <footer className="app-footer">
                        <p>תרגול קריאת התורה / Torah Reading Practice</p>
                    </footer>
                </div>
            </div> :
            <BarMitzvahParashaPage onParashaSelected={onParashaSelected}></BarMitzvahParashaPage>
        }
    </div>
  );
}

export default App;