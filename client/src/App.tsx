import React from 'react';
import { VerseCard } from './components/VerseCard';
import  tora  from './data/torah.json';
import './App.css';
import BarMitzvahParashaPage from "./components/BarMitzvahStart";
import parashaMap from "./parasha_map.json";

function App() {
    const [selectedParasha, setSelectedParasha] = React.useState<any>(
        JSON.parse(localStorage.getItem("selectedParasha") || "null")
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
            setSelectedParasha(parasha);
            localStorage.setItem("selectedParasha", JSON.stringify(parasha));
        }
    }
  return (
    <div className="app">
        {selectedParasha ? <div>
                <header className="app-header">
                    <h1>פרויקט בר מצווה</h1>
                    <h4>Bar Mitzvah Torah Reading Practice</h4>
                    <h2>Your Parasha - <b> {selectedParasha.hebrew}</b></h2>
                </header>
                <main className="verses-container">
                    {tora.filter(a=>a.parasha.toLowerCase().replace("'","") === selectedParasha.english.toLowerCase().replace("'","")).map((pasuk) => (
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