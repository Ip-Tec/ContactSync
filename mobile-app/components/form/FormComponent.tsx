// FormComponent.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

export type Field = {
  name: string;
  placeholder: string;
  secure?: boolean;
};

export type FormProps = {
  title?: string;
  description?: string;
  fields: Field[];
  submitButtonText: string;
  onSubmit: (values: Record<string, string>) => void;
};

export const FormComponent: React.FC<FormProps> = ({
  title,
  description,
  fields,
  submitButtonText,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, string>)
  );

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Basic validation: Ensure all fields are filled out
    for (const field of fields) {
      if (!formValues[field.name]) {
        Alert.alert("Validation Error", `Please fill out ${field.placeholder}`);
        return;
      }
    }
    onSubmit(formValues);
  };

  return (
    <View className="w-full m-4 p-5 drop-shadow-md rounded-xl">
      {title && <Text className="text-xl font-bold mb-4">{title}</Text>}
      {description && (
        <Text className="text-sm text-gray-600 mb-4">{description}</Text>
      )}
      {fields.map((field) => (
        <TextInput
          key={field.name}
          placeholder={field.placeholder}
          secureTextEntry={field.secure || false}
          value={formValues[field.name]}
          onChangeText={(text) => handleChange(field.name, text)}
          className="border border-gray-300 rounded p-3 mb-3"
        />
      ))}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-blue-500 p-3 rounded-lg items-center justify-center"
      >
        <Text className="text-white font-bold">{submitButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
};
