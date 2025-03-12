import React, { forwardRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Control, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { FormData } from "@/types/explore-types";

type ContactFormBottomSheetProps = {
  control: Control<FormData>;
  onSubmit: () => void;
  requiredFieldsMissing: boolean;
};

const ContactFormBottomSheet = forwardRef<
  BottomSheetModal,
  ContactFormBottomSheetProps
>(({ control, onSubmit, requiredFieldsMissing }, ref) => {
  // Local state to control the date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  // console.log({ control });
  console.log({ requiredFieldsMissing });

  return (
    <BottomSheetModal
      ref={ref}
      index={1}
      snapPoints={["25%", "75%"]}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      enableHandlePanningGesture={true}
      enableDismissOnClose={true}
      backgroundStyle={{
        backgroundColor: "#000033",
      }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={10}
          enableTouchThrough={true}
          
        />
      )}
    >
      <View className="p-4 flex-1">
        <Text className="text-xl font-bold text-center mb-4">
          Complete Contact Details
        </Text>

        {requiredFieldsMissing && (
          <>
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <View className="mb-4" style={{
                  backgroundColor: "#000033",
                }}>
                  <Text className="text-gray-600 mb-2">Date of Birth</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="border border-gray-300 rounded-md p-2"
                  >
                    <Text className="text-base">
                      {field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={field.value || new Date()}
                      mode="date"
                      display="default"
                      onChange={(_, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          field.onChange(date);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            />

            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Country</Text>
                  <Picker
                    selectedValue={field.value}
                    onValueChange={field.onChange}
                    className="bg-gray-100 rounded-lg"
                  >
                    <Picker.Item label="Select Country" value="" />
                    <Picker.Item label="Nigeria" value="Nigeria" />
                    <Picker.Item label="Ghana" value="Ghana" />
                  </Picker>
                </View>
              )}
            />

            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Country Code</Text>
                  <Picker
                    selectedValue={field.value}
                    onValueChange={field.onChange}
                    className="bg-gray-100 rounded-lg"
                  >
                    <Picker.Item label="Select Code" value="" />
                    <Picker.Item label="+234" value="+234" />
                    <Picker.Item label="+233" value="+233" />
                  </Picker>
                </View>
              )}
            />

            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Gender</Text>
                  <Picker
                    selectedValue={field.value}
                    onValueChange={field.onChange}
                    className="bg-gray-100 rounded-lg"
                  >
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                  </Picker>
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity
          className="bg-blue-500 p-3 rounded-lg mt-4"
          onPress={onSubmit}
        >
          <Text className="text-white text-center font-bold">
            {requiredFieldsMissing ? "Complete and Add to Cart" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
});

export default ContactFormBottomSheet;
