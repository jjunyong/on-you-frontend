import React from "react";
import { Platform, StatusBar, View } from "react-native";
import { Modalize } from "react-native-modalize";
import { Portal } from "react-native-portalize";
import styled from "styled-components/native";
import CustomText from "../../components/CustomText";

const ModalContainer = styled.View`
  flex: 1;
  padding: 35px 0px 20px 0px;
`;

const OptionButton = styled.TouchableOpacity<{ height: number; padding: number; alignItems: string }>`
  height: ${(props: any) => props.height}px;
  justify-content: center;
  align-items: ${(props: any) => (props.alignItems ? props.alignItems : "center")};
  padding: 0px ${(props: any) => (props.padding ? props.padding : 0)}px;
`;
const OptionName = styled(CustomText)<{ warning: boolean }>`
  font-size: 16px;
  color: ${(props: any) => (props.warning ? "#FF551F" : "#2b2b2b")};
  line-height: 22px;
`;
const Break = styled.View<{ sep: number }>`
  width: 100%;
  margin-bottom: ${(props: any) => props.sep}px;
  margin-top: ${(props: any) => props.sep}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(0, 0, 0, 0.2);
  opacity: 0.5;
`;

interface FeedOptionModalProps {
  modalRef: any;
  buttonHeight: number;
  isMyFeed: boolean;
  goToUpdateFeed: () => void;
  deleteFeed: () => void;
  goToComplain: () => void;
  blockUser: () => void;
}

const FeedOptionModal: React.FC<FeedOptionModalProps> = ({ modalRef, buttonHeight, isMyFeed, goToUpdateFeed, deleteFeed, goToComplain, blockUser }) => {
  const feedOptionList = isMyFeed
    ? [
        { name: "수정", warning: false, onPress: goToUpdateFeed },
        { name: "삭제", warning: true, onPress: deleteFeed },
      ]
    : [
        { name: "신고", warning: false, onPress: goToComplain },
        { name: "사용자 차단", warning: true, onPress: blockUser },
      ];
  const modalHeight = buttonHeight * feedOptionList.length + 60;

  return (
    <Portal>
      <Modalize
        ref={modalRef}
        modalHeight={modalHeight}
        handlePosition="inside"
        handleStyle={{ top: 14, height: 3, width: 35, backgroundColor: "#d4d4d4" }}
        modalStyle={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        onOpen={() => {
          if (Platform.OS === "android") {
            StatusBar.setBackgroundColor("black", true);
            StatusBar.setBarStyle("light-content", true);
          }
        }}
        onClose={() => {
          if (Platform.OS === "android") {
            StatusBar.setBackgroundColor("white", true);
            StatusBar.setBarStyle("dark-content", true);
          }
        }}
      >
        <ModalContainer style={{ flex: 1 }}>
          {feedOptionList.map((option, index) => (
            <View key={`FeedOption_${index}`}>
              {index > 0 ? <Break sep={1} /> : <></>}
              <OptionButton onPress={option.onPress} height={buttonHeight}>
                <OptionName warning={option.warning}>{option.name}</OptionName>
              </OptionButton>
            </View>
          ))}
        </ModalContainer>
      </Modalize>
    </Portal>
  );
};
export default FeedOptionModal;
