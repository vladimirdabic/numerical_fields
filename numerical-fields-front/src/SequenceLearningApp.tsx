import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Trophy, BookOpen } from 'lucide-react';
import { InlineMath } from 'react-katex';

interface Sequence {
    id: string;
    name: string;
    description: string;
    color: string;
    formula: string;
    fun_fact: string;
}

interface NumberSlot {
    value: number;
    isBlank: boolean;
    index: number;
}

const api: string = import.meta.env.VITE_BACKEND_URL;

const SequenceLearningApp = () => {
    const [currentMode, setCurrentMode] = useState('learn'); // 'learn' or 'game'

    const [isLoading, setIsLoading] = useState(true);
    const [sequences, setSequences] = useState<Record<string, Sequence>>({});
    
    const [sequenceNumbers, setSequenceNumbers] = useState<number[]>([]);
    const [isGeneratingGame, setIsGeneratingGame] = useState(false);
    const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);

    const [gameData, setGameData] = useState<NumberSlot[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

    const [selectedSequence, setSelectedSequence] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [feedback, setFeedback] = useState<Record<number, boolean | null>>({});

    const generateSequence = async (id: string, count: number): Promise<number[]> => {
        const queryParams = new URLSearchParams({
            count: count.toString()
        });

        const url = `${api}/sequences/${id}/generate?${queryParams}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if(!response.ok) {
            // TODO: Handle
            return [];
        }

        const data = await response.json();
        return data.result;
    };

    const fetchSingle = async (seqId: string): Promise<Sequence> => {
        const url = `${api}/sequences/${seqId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const seqData = await response.json();

        return {
            id: seqData.text_id,
            name: seqData.name,
            description: seqData.description,
            color: seqData.color,
            formula: seqData.formula,
            fun_fact: seqData.fun_fact
        };
    };

    const fetchSequences = async (): Promise<void> => {
        const response = await fetch(`${api}/sequences`);
        if(!response.ok) return;

        const ids = await response.json();
        const result: Record<string, Sequence> = {};
        
        await Promise.all(ids.map(async (id: string) => {
            const seq = await fetchSingle(id);
            result[seq.id] = seq;
        }));

        setSequences(result);

        if (ids.length > 0) {
            setSelectedSequence(ids[0]);
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);
            try {
                await fetchSequences(); 
            } catch (error) {
                console.error("Initialization failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (!selectedSequence || !sequences[selectedSequence]) return;
        if (currentMode === 'game') return;

        const fetchSequence = async () => {
            setIsGeneratingSequence(true);
            try {
                const data = await generateSequence(sequences[selectedSequence].id, 10);
                setSequenceNumbers(data);
            } catch (error) {
                console.error("Failed to fetch sequence:", error);
            } finally {
                setIsGeneratingSequence(false);
            }
        };

        fetchSequence();
    }, [selectedSequence, sequences]);

    const generateGame = async () => {
        setIsGeneratingGame(true);
        const seq = sequences[selectedSequence];
        
        const fullSequence = await generateSequence(seq.id, 10);
        const blanksCount = 3 + Math.floor(Math.random() * 2); // 3-4 blanks
        const blankIndices: number[] = [];

        while (blankIndices.length < blanksCount) {
            const idx = Math.floor(Math.random() * fullSequence.length);
            if (!blankIndices.includes(idx)) {
                blankIndices.push(idx);
            }
        }

        const gameSequence: NumberSlot[] = fullSequence.map((num, idx) => ({
            value: num,
            isBlank: blankIndices.includes(idx),
            index: idx
        }));

        setGameData(gameSequence);
        setUserAnswers({});
        setFeedback({});
        setIsGeneratingGame(false);
    };

    useEffect(() => {
        if (currentMode === 'game') {
            generateGame();
            setAttempts(0);
        }
    }, [currentMode, selectedSequence]);

    const handleAnswerChange = (index: number, value: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [index]: parseInt(value)
        }));
        setFeedback(prev => ({
            ...prev,
            [index]: null
        }));
    };

    const checkAnswers = () => {
        //let correct = 0;
        const newFeedback: Record<number, boolean> = {};

        gameData.forEach(item => {
            if (item.isBlank) {
                const userAnswer = userAnswers[item.index];
                const isCorrect = userAnswer === item.value;
                newFeedback[item.index] = isCorrect;
                //if (isCorrect) correct++;
            }
        });

        setFeedback(newFeedback);
        setAttempts(prev => prev + 1);
    };

    const allCorrect = (): boolean => {
        for(const [_, isCorrect] of Object.entries(feedback)) {
            if(!isCorrect) return false;
        }

        return true;
    }

    const resetGame = () => {
        generateGame();
        setAttempts(0);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-gray-800 mb-2">Brojevni nizovi</h1>
                    <p className="text-gray-600">Savladajte brojevne nizove</p>
                </div>

                {/* Mode Selection */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setCurrentMode('learn')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${currentMode === 'learn'
                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <BookOpen size={20} />
                        Ucenje
                    </button>
                    <button
                        onClick={() => setCurrentMode('game')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${currentMode === 'game'
                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Trophy size={20} />
                        Kviz
                    </button>
                </div>

                {/* Sequence Selector */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {Object.entries(sequences).map(([key, seq]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedSequence(key)}
                            style={{ backgroundColor: seq.color }}
                            className={`p-4 rounded-lg text-white font-semibold transition-all ${
                                    selectedSequence === key
                                    ? 'ring-4 ring-yellow-400 scale-105 shadow-xl'
                                    : 'opacity-80 hover:opacity-100 hover:scale-102'
                                }`}
                        >
                            {seq.name}
                        </button>
                    ))}
                </div>

                {/* Learn Mode */}
                {currentMode === 'learn' && sequences[selectedSequence] && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                {sequences[selectedSequence].name}
                            </h2>
                            <p className="text-gray-600 text-lg mb-4">
                                {sequences[selectedSequence].description}
                            </p>
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <span className="font-semibold text-gray-700">Formula: </span>
                                <span className="text-gray-700 text-lg">
                                    <InlineMath math={sequences[selectedSequence].formula} />
                                </span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-4 text-gray-700">Primer niza:</h3>
                            {isGeneratingSequence ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {sequenceNumbers.map((num, idx) => (
                                        <div
                                            key={idx}
                                            style={{ backgroundColor: sequences[selectedSequence].color }}
                                            className="text-white w-16 h-16 flex items-center justify-center rounded-lg font-bold text-xl shadow-md"
                                        >
                                            {num}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h3 className="font-semibold text-gray-800 mb-2">Da li ste znali?</h3>
                            <InlineMath math={sequences[selectedSequence].fun_fact} />
                        </div>
                    </div>
                )}

                {/* Game Mode */}
                {currentMode === 'game' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Popunite nedostajuće brojeve!
                                </h2>
                                <p className="text-gray-600">
                                    Završite niz:
                                </p>
                            </div>
                            <div className="text-right">
                                {/*<div className="text-3xl font-bold text-indigo-600">{score}</div>*/}
                                {/*<div className="text-sm text-gray-600">Poeni</div>*/}
                            </div>
                        </div>

                        {isGeneratingGame ? (
                            <div className="flex justify-center items-center h-32 mb-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (

                            <div className="flex flex-wrap gap-4 mb-8">
                                {gameData.map((item, idx) => (
                                    <div key={idx} className="relative">
                                        {item.isBlank ? (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={userAnswers[item.index] !== undefined ? userAnswers[item.index] : ''}
                                                    onChange={(e) => handleAnswerChange(item.index, e.target.value)}
                                                    className={`w-16 h-16 text-center border-2 rounded-lg font-bold text-xl ${feedback[item.index] === true
                                                            ? 'border-green-500 bg-green-50'
                                                            : feedback[item.index] === false
                                                                ? 'border-red-500 bg-red-50'
                                                                : 'border-gray-300'
                                                        }`}
                                                    placeholder="?"
                                                />
                                                {feedback[item.index] === true && (
                                                    <Check className="absolute -top-2 -right-2 text-green-500 bg-white rounded-full" size={24} />
                                                )}
                                                {feedback[item.index] === false && (
                                                    <X className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full" size={24} />
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                style={{ backgroundColor: sequences[selectedSequence].color }} 
                                                className={`text-white w-16 h-16 flex items-center justify-center rounded-lg font-bold text-xl shadow-md`}
                                            >
                                                {item.value}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={checkAnswers}
                                className="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                            >
                                Proveri
                            </button>
                            <button
                                onClick={resetGame}
                                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                <RotateCcw size={20} />
                                Nova igra
                            </button>
                        </div>

                        {attempts > 0 && (
                            <div className="mt-6 p-4 bg-purple-50 rounded-lg text-center">
                                {allCorrect() && (
                                    <p className="text-gray-700">
                                        Bravo konju jedan
                                    </p>
                                )}

                                {!allCorrect() && (
                                    <p className="text-gray-700">
                                        Majmune ne znas nista
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SequenceLearningApp;