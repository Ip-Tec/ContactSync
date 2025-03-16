// AccountSettingsBottomSheet.tsx
import React, { useMemo, forwardRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";

type Props = {
    onChangeEmail: () => void;
    onChangePhoneNumber: () => void;
    onChangePassword: () => void;
    onDeleteAccount: () => void;
};

const AccountSettingsBottomSheet = forwardRef<BottomSheet, Props>(
    (props, ref) => {
        const { onChangeEmail, onChangePhoneNumber, onChangePassword, onDeleteAccount } = props;
        // Define snap points for the bottom sheet
        const snapPoints = useMemo(() => ["25%", "50%"], []);

        return (
            <BottomSheet ref={ref} index={1} snapPoints={snapPoints}>
                <View style={styles.sheetContent}>
                    <TouchableOpacity style={styles.button} onPress={onChangeEmail}>
                        <Text style={styles.buttonText}>Change Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onChangePhoneNumber}>
                        <Text style={styles.buttonText}>Change Phone Number</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onChangePassword}>
                        <Text style={styles.buttonText}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAccount}>
                        {/* <Text style={styles.deleteButtonText}>Delete Account</Text> */}
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        );
    }
);

export default AccountSettingsBottomSheet;

const styles = StyleSheet.create({
    sheetContent: {
        flex: 1,
        padding: 16,
    },
    button: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    buttonText: {
        fontSize: 16,
    },
    deleteButton: {
        paddingVertical: 12,
        marginTop: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        color: "red",
    },
});
