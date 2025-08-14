import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAuthUser, signOut } from './features/loginModal/authSlice'

import Vocabulary from './features/01vocabulary/Vocabulary'
import Grammar from './features/02grammar/Grammar'
import Reading from './features/03reading/Reading'
import Listening from './features/04listening/Listening'
import Speaking from './features/05speaking/Speaking'
import Writing from './features/06writing/Writing'
import Mistakes from './features/07mistakes/Mistakes'

import { Menubar } from 'primereact/menubar'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { TabPanel, TabView } from 'primereact/tabview'

import LoginModal from './features/loginModal/LoginModal'
import AddMistakeModal from './features/07mistakes/AddMistakeModal'
import { ProgressSpinner } from 'primereact/progressspinner'
import { supabaseClient } from './app/supabaseClient'

function App() {
    const dispatch = useDispatch()
    const { user, status } = useSelector(state => state.auth)

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [loginModalVisible, setLoginModalVisible] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const stored = localStorage.getItem('selectedTabIndex')
        return stored !== null ? parseInt(stored, 10) : 0
    })
    const [mistakeModalVisible, setMistakeModalVisible] = useState(false)
    const [mistakeType, setMistakeType] = useState(null)

    // Fetch user
    useEffect(() => {
        dispatch(fetchAuthUser())

        const authListener = supabaseClient.auth.onAuthStateChange(() => {
            dispatch(fetchAuthUser())
        })

        return () => {
            authListener.data?.subscription?.unsubscribe()
        }
    }, [dispatch])

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Show login modal if not authenticated
    useEffect(() => {
        if (status === 'succeeded' && !user) setLoginModalVisible(true)
        else if (status === 'succeeded' && user) setLoginModalVisible(false)
    }, [user, status])

    // Menu
    const menuItems = [
        { label: 'English Trainer', icon: 'pi pi-book' },
        {
            label: user ? `Logout (${user.email})` : 'Login',
            icon: user ? 'pi pi-sign-out' : 'pi pi-sign-in',
            command: () => {
                if (user) dispatch(signOut())
            },
        },
    ]

    const openMistakeModal = (type) => {
        if (!type) return
        setMistakeType(type)
        setMistakeModalVisible(true)
    }

    // Stable tabs reference
    const tabs = useMemo(() => [
        { header: 'Vocabulary', type: 'vocabulary', content: <Vocabulary /> },
        { header: 'Grammar', type: 'grammar', content: <Grammar /> },
        { header: 'Reading', type: 'reading', content: <Reading /> },
        { header: 'Listening', type: 'listening', content: <Listening /> },
        { header: 'Speaking', type: 'speaking', content: <Speaking /> },
        { header: 'Writing', type: 'writing', content: <Writing /> },
        { header: 'Mistakes', type: 'mistakes', content: <Mistakes /> },
    ], [])

    const handleTabChange = (e) => {
        setSelectedIndex(e.index)
        localStorage.setItem('selectedTabIndex', e.index)
    }

    // Global shortcut listener
    useEffect(() => {
        const handleShortcut = (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // stops the default menu immediately
                const type = tabs[selectedIndex]?.type;
                if (type) openMistakeModal(type);
            }
        };

        window.addEventListener('contextmenu', handleShortcut); // catch right-click
        return () => window.removeEventListener('contextmenu', handleShortcut);
    }, [selectedIndex, tabs]);



    return (
        <div className="h-screen flex flex-col">
            {status === 'loading' && (
                <div className="flex justify-center items-center h-screen w-screen">
                    <ProgressSpinner />
                </div>
            )}

            <LoginModal visible={loginModalVisible} />

            {status === 'succeeded' && user && (
                <>
                    <Menubar model={menuItems} />
                    <div className="p-4 flex-grow overflow-auto">
                        {isMobile ? (
                            <Accordion
                                multiple
                                activeIndex={[selectedIndex]}
                                onTabChange={(e) => handleTabChange({ index: e.index[0] })}
                            >
                                {tabs.map(({ header, content }) => (
                                    <AccordionTab key={header} header={header}>
                                        {content}
                                    </AccordionTab>
                                ))}
                            </Accordion>
                        ) : (
                            <TabView activeIndex={selectedIndex} onTabChange={handleTabChange}>
                                {tabs.map(({ header, content }) => (
                                    <TabPanel key={header} header={header}>
                                        {content}
                                    </TabPanel>
                                ))}
                            </TabView>
                        )}
                    </div>
                </>
            )}

            <AddMistakeModal
                visible={mistakeModalVisible}
                onHide={() => setMistakeModalVisible(false)}
                initialType={mistakeType}
            />
        </div>
    )
}

export default App
