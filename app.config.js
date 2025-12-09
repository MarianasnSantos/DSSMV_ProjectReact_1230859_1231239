import 'dotenv/config';

export default {
    expo: {
        name: 'PetMatch',
        slug: 'petmatch',
        version: '1.0.0',
        sdkVersion: '49.0.0',
        extra: {
            EXPO_PUBLIC_API_KEY: process.env.EXPO_PUBLIC_API_KEY,
        },
    },
};
