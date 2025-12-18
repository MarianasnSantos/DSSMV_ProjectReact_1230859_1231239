import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export const AppInput = (props) => (
    <TextInput
        {...props}
        style={[styles.input, props.style]}
        placeholderTextColor="#555555"
    />
);

const styles = StyleSheet.create({
    input: {
        backgroundColor: "#ffffff",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#FFB6C1",
        color: "#000000",
        fontSize: 16,
        marginBottom: 15
    }
});