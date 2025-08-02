import { useState, useEffect } from 'react';
import Vocabulary from "./features/01vocabulary/Vocabulary";
import Grammar from "./features/02grammar/Grammar";
import Reading from "./features/03reading/Reading";
import Listening from "./features/04listening/Listening";
import Speaking from "./features/05speaking/Speaking";
import Writing from "./features/06writing/Writing";
import Mistakes from "./features/07mistakes/Mistakes";
import {Menubar} from "primereact/menubar";
import {Accordion, AccordionTab} from "primereact/accordion";
import {TabPanel, TabView} from "primereact/tabview";

function App() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 768);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { label: 'English Trainer', icon: 'pi pi-book' }
    ];

    const tabs = [
        { header: 'Vocabulary', content: <Vocabulary /> },
        { header: 'Grammar', content: <Grammar /> },
        { header: 'Reading', content: <Reading /> },
        { header: 'Listening', content: <Listening /> },
        { header: 'Speaking', content: <Speaking /> },
        { header: 'Writing', content: <Writing /> },
        { header: 'Mistakes', content: <Mistakes /> }
    ];

    return (
        <div className="h-screen flex flex-col">
            <Menubar model={menuItems} />
            <div className="p-4 flex-grow overflow-auto">
                {isMobile ? (
                    <Accordion multiple>
                        {tabs.map(({ header, content }) => (
                            <AccordionTab key={header} header={header}>
                                {content}
                            </AccordionTab>
                        ))}
                    </Accordion>
                ) : (
                    <TabView>
                        {tabs.map(({ header, content }) => (
                            <TabPanel key={header} header={header}>
                                {content}
                            </TabPanel>
                        ))}
                    </TabView>
                )}
            </div>
        </div>
    );
}

export default App;