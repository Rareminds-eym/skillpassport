// Assessment scoring and analysis utilities

export const calculateRIASEC = (answers) => {
    const scores = { R: [], I: [], A: [], S: [], E: [], C: [] };

    Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('riasec_')) {
            const questionId = key.split('_')[1];
            const type = questionId.charAt(0).toUpperCase();
            if (scores[type]) {
                scores[type].push(value);
            }
        }
    });

    const averages = {};
    Object.keys(scores).forEach(type => {
        averages[type] = scores[type].length > 0
            ? scores[type].reduce((a, b) => a + b, 0) / scores[type].length
            : 0;
    });

    // Get top 3 types
    const sorted = Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return {
        scores: averages,
        topThree: sorted.map(([type]) => type),
        code: sorted.map(([type]) => type).join('')
    };
};

export const calculateBigFive = (answers) => {
    const traits = { O: [], C: [], E: [], A: [], N: [] };

    Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('bigfive_')) {
            const questionId = key.split('_')[1];
            const type = questionId.charAt(0).toLowerCase();
            const traitKey = type.toUpperCase();
            if (traits[traitKey]) {
                traits[traitKey].push(value);
            }
        }
    });

    const averages = {};
    Object.keys(traits).forEach(trait => {
        averages[trait] = traits[trait].length > 0
            ? traits[trait].reduce((a, b) => a + b, 0) / traits[trait].length
            : 0;
    });

    return averages;
};

export const calculateWorkValues = (answers) => {
    const values = {
        Security: [],
        Autonomy: [],
        Creativity: [],
        Status: [],
        Impact: [],
        Financial: [],
        Leadership: [],
        Lifestyle: []
    };

    Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('values_')) {
            const questionId = key.split('_')[1];
            // Determine which value this belongs to based on question ID prefix
            if (questionId.startsWith('sec')) values.Security.push(value);
            else if (questionId.startsWith('aut')) values.Autonomy.push(value);
            else if (questionId.startsWith('cre')) values.Creativity.push(value);
            else if (questionId.startsWith('sta')) values.Status.push(value);
            else if (questionId.startsWith('imp')) values.Impact.push(value);
            else if (questionId.startsWith('fin')) values.Financial.push(value);
            else if (questionId.startsWith('lea')) values.Leadership.push(value);
            else if (questionId.startsWith('lif')) values.Lifestyle.push(value);
        }
    });

    const averages = {};
    Object.keys(values).forEach(val => {
        averages[val] = values[val].length > 0
            ? values[val].reduce((a, b) => a + b, 0) / values[val].length
            : 0;
    });

    // Get top 3
    const sorted = Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return {
        scores: averages,
        topThree: sorted.map(([val, score]) => ({ value: val, score }))
    };
};

export const calculateEmployability = (answers) => {
    const skills = {
        Communication: [],
        Teamwork: [],
        ProblemSolving: [],
        Adaptability: [],
        Leadership: [],
        DigitalFluency: [],
        Professionalism: [],
        CareerReadiness: []
    };

    let sjtScore = 0;
    let sjtCount = 0;

    Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('employability_')) {
            const questionId = key.split('_')[1];

            if (questionId.startsWith('sjt')) {
                // SJT questions - check if answer matches best answer
                // For now, we'll give partial credit based on the option chosen
                sjtCount++;
                // This is simplified - in production you'd compare against correct answers
                if (typeof value === 'string' && (
                    value.includes('privately') ||
                    value.includes('renegotiate') ||
                    value.includes('Inform mentor') ||
                    value.includes('Facilitate') ||
                    value.includes('Learn basics') ||
                    value.includes('Practice')
                )) {
                    sjtScore += 2; // Best answer
                } else {
                    sjtScore += 1; // Other answers
                }
            } else {
                // Regular skill questions
                if (questionId.startsWith('com')) skills.Communication.push(value);
                else if (questionId.startsWith('tm')) skills.Teamwork.push(value);
                else if (questionId.startsWith('ps')) skills.ProblemSolving.push(value);
                else if (questionId.startsWith('ad')) skills.Adaptability.push(value);
                else if (questionId.startsWith('ld')) skills.Leadership.push(value);
                else if (questionId.startsWith('df')) skills.DigitalFluency.push(value);
                else if (questionId.startsWith('pr')) skills.Professionalism.push(value);
                else if (questionId.startsWith('cr')) skills.CareerReadiness.push(value);
            }
        }
    });

    const averages = {};
    Object.keys(skills).forEach(skill => {
        averages[skill] = skills[skill].length > 0
            ? skills[skill].reduce((a, b) => a + b, 0) / skills[skill].length
            : 0;
    });

    return {
        skillScores: averages,
        sjtScore: sjtCount > 0 ? (sjtScore / (sjtCount * 2)) * 100 : 0 // Normalize to percentage
    };
};

export const calculateKnowledgeScore = (answers, stream) => {
    let correct = 0;
    let total = 0;

    Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('knowledge_')) {
            total++;
            // In production, you'd check against correct answers from the question bank
            // For now, we'll simulate a score
            // You'd need to import streamKnowledgeQuestions and check correct answers
        }
    });

    // Simplified - in production you'd calculate actual correct answers
    return {
        score: Math.round(Math.random() * 30 + 60), // Simulated 60-90% range
        total: total
    };
};

export const getCareerClusters = (riasecCode) => {
    const clusterMap = {
        // Engineering & Technical
        'IRS': { title: 'Software Engineering', description: 'Core Development & Engineering', fit: 'High' },
        'IRC': { title: 'Data Science & AI', description: 'Analytics, ML & Data Engineering', fit: 'High' },
        'RIC': { title: 'Cybersecurity / Cloud / DevOps', description: 'Infrastructure & Security', fit: 'High' },

        // Business & Enterprising
        'EIC': { title: 'Product / Tech Consulting', description: 'Business & Technology Intersection', fit: 'High' },
        'ESC': { title: 'Marketing / Sales / Business Development', description: 'Growth & Revenue', fit: 'High' },
        'ECS': { title: 'Operations / Finance / Admin', description: 'Business Operations', fit: 'High' },

        // Creative & Artistic
        'AIE': { title: 'UI/UX Design / Product Design', description: 'User Experience & Design', fit: 'High' },
        'AIS': { title: 'Content Creation / Media', description: 'Digital Content & Communication', fit: 'High' },

        // Social & Helping
        'SAE': { title: 'HR / Training / L&D', description: 'People Development', fit: 'High' },
        'SIA': { title: 'Education / Counseling', description: 'Teaching & Guidance', fit: 'High' },
    };

    // Try to find exact match first
    if (clusterMap[riasecCode]) {
        return [clusterMap[riasecCode]];
    }

    // Otherwise match based on first letter priority
    const firstLetter = riasecCode[0];
    const matches = Object.entries(clusterMap)
        .filter(([code]) => code[0] === firstLetter)
        .map(([, cluster]) => cluster);

    return matches.length > 0 ? matches : [
        { title: 'Exploratory Path', description: 'Multiple career options available', fit: 'Medium' }
    ];
};

export const getSkillLevel = (score) => {
    if (score >= 4) return { level: 'Strong', color: 'green' };
    if (score >= 3) return { level: 'Developing', color: 'blue' };
    return { level: 'Needs Focus', color: 'orange' };
};

export const getTraitInterpretation = (trait, score) => {
    const interpretations = {
        O: {
            high: 'You are curious, creative, and open to new experiences. You enjoy learning and exploring innovative ideas.',
            low: 'You prefer practical, conventional approaches and value stability and familiarity.'
        },
        C: {
            high: 'You are organized, disciplined, and reliable. You plan ahead and follow through on commitments.',
            low: 'You are flexible and spontaneous, preferring to adapt as situations unfold.'
        },
        E: {
            high: 'You are sociable, energetic, and enjoy being around people. You thrive in interactive environments.',
            low: 'You prefer quieter settings and recharge through solitary activities.'
        },
        A: {
            high: 'You are cooperative, empathetic, and value harmony in relationships.',
            low: 'You are competitive and direct, focusing on results over relationships.'
        },
        N: {
            high: 'You experience emotions intensely and may be more sensitive to stress.',
            low: 'You are emotionally stable and resilient under pressure.'
        }
    };

    return score >= 3.5 ? interpretations[trait].high : interpretations[trait].low;
};
