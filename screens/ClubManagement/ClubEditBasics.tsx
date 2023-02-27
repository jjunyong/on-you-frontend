import React, { useEffect, useLayoutEffect, useState } from "react";
import { DeviceEventEmitter, KeyboardAvoidingView, Platform, TouchableOpacity, useWindowDimensions } from "react-native";
import styled from "styled-components/native";
import { ClubEditBasicsProps } from "../../Types/Club";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "react-query";
import { Category, CategoryResponse, ClubApi, ClubUpdateRequest } from "../../api";
import { useToast } from "react-native-toast-notifications";
import CustomText from "../../components/CustomText";
import CustomTextInput from "../../components/CustomTextInput";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/reducers";

const Container = styled.SafeAreaView`
  flex: 1;
`;

const MainView = styled.ScrollView``;
const Header = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(0, 0, 0, 0.1);
`;

const ImagePickerButton = styled.TouchableOpacity<{ height: number }>`
  width: 100%;
  height: ${(props: any) => props.height}px;
  justify-content: center;
  align-items: center;
  background-color: #d3d3d3;
`;

const ImagePickerText = styled(CustomText)`
  font-size: 15px;
  color: #2995fa;
  line-height: 21px;
`;

const PickedImage = styled.Image<{ height: number }>`
  width: 100%;
  height: ${(props: any) => props.height}px;
`;

const Content = styled.View`
  padding: 10px 20px 0px 20px;
  margin-bottom: 50px;
`;

const ContentItem = styled.View`
  width: 100%;
  flex: 1;
  border-bottom-width: 1px;
  border-bottom-color: #cecece;
  padding-bottom: 3px;
  margin: 10px 0px;
`;

const Item = styled.View`
  width: 100%;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ItemTitle = styled(CustomText)`
  font-size: 13px;
  line-height: 19px;
  color: #b0b0b0;
  margin-bottom: 5px;
`;

const ItemText = styled(CustomText)`
  font-size: 14px;
  line-height: 19px;
  margin-right: 5px;
`;

const ItemTextInput = styled(CustomTextInput)`
  font-size: 15px;
  line-height: 20px;
  padding: 0px 5px;
  flex: 1;
`;

const RadioButtonView = styled.View`
  flex-direction: row;
  padding: 2px 5px;
  align-items: center;
`;

const RadioButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-right: 10px;
`;

const CheckButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const CheckBox = styled.View<{ check: boolean }>`
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: white;
`;

const CategoryText = styled(CustomText)<{ selected?: boolean }>`
  font-size: 14px;
  line-height: 21px;
  text-align: center;
  color: ${(props: any) => (props.selected ? "white" : "black")};
`;

const CategoryView = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin: 10px 0px;
`;
const CategoryLabel = styled.TouchableOpacity<{ selected?: boolean }>`
  justify-content: center;
  align-items: center;
  padding: 3px 5px;
  border-radius: 20px;
  border: 1px solid #d7d7d7;
  background-color: ${(props: any) => (props.selected ? "#295AF5" : "white")};
  margin: 0px 5px;
`;

const ClubEditBasics: React.FC<ClubEditBasicsProps> = ({
  navigation: { navigate, setOptions, goBack },
  route: {
    params: { clubData },
  },
}) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const toast = useToast();
  const [clubName, setClubName] = useState<string>(clubData.name ?? "");
  const [maxNumber, setMaxNumber] = useState<string>(clubData.maxNumber === 0 ? "무제한 정원" : `${String(clubData.maxNumber)} 명`);
  const [maxNumberInfinity, setMaxNumberInfinity] = useState<boolean>(clubData.maxNumber ? false : true);
  const [phoneNumber, setPhoneNumber] = useState<string>(clubData.contactPhone ?? "");
  const [organizationName, setOrganizationName] = useState<string>(clubData.organizationName ?? "");
  const [isApproveRequired, setIsApproveRequired] = useState<string>(clubData.isApprovedRequired ?? "");
  const [selectCategory1, setCategory1] = useState((clubData.categories && clubData.categories[0]?.id) ?? -1);
  const [selectCategory2, setCategory2] = useState((clubData.categories && clubData.categories[1]?.id) ?? -1);
  const [categoryBundle, setCategoryBundle] = useState<Array<Category[]>>();
  const [imageURI, setImageURI] = useState<string | null>(null);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const imageHeight = Math.floor(((SCREEN_WIDTH * 0.8) / 5) * 3);

  const { isLoading: categoryLoading, data: categories } = useQuery<CategoryResponse>(["getCategories", token], ClubApi.getCategories, {
    onSuccess: (res) => {
      if (res.status === 200) {
        const count = 4;
        const bundle = [];
        for (let i = 0; i < res.data.length; i += count) bundle.push(res.data.slice(i, i + count));
        setCategoryBundle(bundle);
      } else {
        console.log(`--- getCategories status: ${res.status} ---`);
        console.log(res);
        toast.show(`카테고리를 불러오지 못했습니다. (status: ${res.status}})`, {
          type: "warning",
        });
      }
    },
    onError: (error) => {
      console.log(`--- getCategories error ---`);
      console.log(error);
      toast.show(`카테고리를 불러오지 못했습니다. (error: ${error})`, {
        type: "warning",
      });
    },
  });
  const mutation = useMutation(ClubApi.updateClub, {
    onSuccess: (res) => {
      if (res.status === 200 && res.resultCode === "OK") {
        toast.show(`저장이 완료되었습니다.`, {
          type: "success",
        });
        navigate("ClubManagementMain", { clubData: res.data, refresh: true });
      } else {
        console.log(`updateClub mutation success but please check status code`);
        console.log(`status: ${res.status}`);
        console.log(res);
        toast.show(`Error Code: ${res.status}`, {
          type: "warning",
        });
      }
    },
    onError: (error) => {
      console.log("--- Error updateClub ---");
      console.log(`error: ${error}`);
      toast.show(`Error Code: ${error}`, {
        type: "warning",
      });
    },
    onSettled: (res, error) => {},
  });

  useLayoutEffect(() => {
    setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={save}>
          <CustomText style={{ color: "#2995FA", fontSize: 14, lineHeight: 20 }}>저장</CustomText>
        </TouchableOpacity>
      ),
    });
  }, [clubName, maxNumber, maxNumberInfinity, organizationName, isApproveRequired, phoneNumber, imageURI, selectCategory1, selectCategory2]);

  useEffect(() => {
    if (phoneNumber.length === 10) {
      setPhoneNumber(phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"));
    } else if (phoneNumber.length === 11) {
      setPhoneNumber(phoneNumber.replace(/-/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"));
    } else if (phoneNumber.length === 12) {
      setPhoneNumber(phoneNumber.replace(/-/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"));
    } else if (phoneNumber.length === 13) {
      setPhoneNumber(phoneNumber.replace(/-/g, "").replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"));
    }
  }, [phoneNumber]);

  const save = () => {
    let category1 = selectCategory1;
    let category2 = selectCategory2;
    if (category1 === -1 && category2 === -1) {
      toast.show(`카테고리가 설정되어있지 않습니다.`, {
        type: "warning",
      });
      return;
    } else if (category1 === -1 && category2 !== -1) {
      category1 = category2;
      category2 = -1;
    }

    const contactPhone = phoneNumber.replace(/-/g, "");
    let data = {
      category1Id: category1,
      clubName,
      clubMaxMember: maxNumberInfinity ? 0 : Number(maxNumber.split(" ")[0]),
      isApproveRequired,
      organizationName,
      contactPhone: contactPhone === "" ? null : contactPhone,
    };
    if (category2 !== -1) data.category2Id = category2;

    const splitedURI = new String(imageURI).split("/");

    const updateData: ClubUpdateRequest =
      imageURI === null
        ? {
            data,
            token,
            clubId: clubData.id,
          }
        : {
            image: {
              uri: Platform.OS === "android" ? imageURI : imageURI.replace("file://", ""),
              type: "image/jpeg",
              name: splitedURI[splitedURI.length - 1],
            },
            data,
            token,
            clubId: clubData.id,
          };

    console.log(data);

    mutation.mutate(updateData);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [16, 9],
      quality: 1,
    });

    if (result.canceled === false) {
      setImageURI(result.assets[0].uri);
    }
  };

  const onPressCategory = (id: number) => {
    if (selectCategory1 === id) {
      return setCategory1(-1);
    } else if (selectCategory2 === id) {
      return setCategory2(-1);
    }
    if (selectCategory1 === -1) {
      return setCategory1(id);
    } else if (selectCategory2 === -1) {
      return setCategory2(id);
    } else {
      toast.show("카테고리는 최대 2개만 고를 수 있습니다.", {
        type: "warning",
      });
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={40} style={{ flex: 1 }}>
        <MainView>
          <Header>
            <ImagePickerButton height={imageHeight} onPress={pickImage} activeOpacity={0.8}>
              {imageURI ? <PickedImage height={imageHeight} source={{ uri: imageURI }} /> : <ImagePickerText>대표 사진 바꾸기</ImagePickerText>}
            </ImagePickerButton>
          </Header>
          <Content>
            <ContentItem>
              <ItemTitle>모임 이름</ItemTitle>
              <ItemTextInput
                value={clubName}
                placeholder="모임명 8자 이내 (특수문자 불가)"
                placeholderTextColor="#B0B0B0"
                maxLength={9}
                onEndEditing={() => {
                  if (clubName === "") {
                    toast.show("모임 이름을 공백으로 설정할 수 없습니다.", {
                      type: "warning",
                    });
                    setClubName(clubData.name ?? "");
                  } else setClubName((prev) => prev.trim());
                }}
                onChangeText={(name: string) => {
                  if (name.length > 8) {
                    toast.show("모임 이름은 8자 제한입니다.", {
                      type: "warning",
                    });
                  } else setClubName(name);
                }}
                returnKeyType="done"
                returnKeyLabel="done"
                includeFontPadding={false}
              />
            </ContentItem>
            <ContentItem>
              <ItemTitle>모집 정원</ItemTitle>
              <Item>
                <ItemTextInput
                  keyboardType="number-pad"
                  placeholder="최대 수용가능 정원 수"
                  placeholderTextColor="#B0B0B0"
                  onPressIn={() => {
                    if (maxNumberInfinity === false) setMaxNumber((prev) => prev.split(" ")[0]);
                  }}
                  onEndEditing={() =>
                    setMaxNumber((prev) => {
                      if (prev.trim() === "" || prev.trim() === "0") return `${clubData.maxNumber} 명`;
                      else return `${prev} 명`;
                    })
                  }
                  value={maxNumber}
                  maxLength={6}
                  onChangeText={(num: string) => {
                    if (num.length < 3) setMaxNumber(num);
                    else
                      toast.show("최대 99명까지 가능합니다.", {
                        type: "warning",
                      });
                  }}
                  editable={!maxNumberInfinity}
                  includeFontPadding={false}
                />
                <CheckButton
                  onPress={() => {
                    if (!maxNumberInfinity) setMaxNumber("무제한 정원");
                    else setMaxNumber(`${clubData.maxNumber} 명`);

                    setMaxNumberInfinity((prev) => !prev);
                  }}
                >
                  <ItemText>인원 수 무제한으로 받기</ItemText>
                  <CheckBox check={maxNumberInfinity}>
                    <Ionicons name="checkmark-sharp" size={13} color={maxNumberInfinity ? "#FF6534" : "#e8e8e8"} />
                  </CheckBox>
                </CheckButton>
              </Item>
            </ContentItem>
            <ContentItem>
              <ItemTitle>가입 승인 방법</ItemTitle>
              <RadioButtonView>
                <RadioButton onPress={() => setIsApproveRequired((prev) => (prev === "Y" ? "Y" : "Y"))}>
                  <Ionicons
                    name={isApproveRequired === "Y" ? "radio-button-on" : "radio-button-off"}
                    size={16}
                    color={isApproveRequired === "Y" ? "#FF6534" : "rgba(0, 0, 0, 0.3)"}
                    style={{ marginRight: 3 }}
                  />
                  <ItemText>관리자 승인 후 가입</ItemText>
                </RadioButton>
                <RadioButton onPress={() => setIsApproveRequired((prev) => (prev === "Y" ? "N" : "N"))}>
                  <Ionicons
                    name={isApproveRequired === "N" ? "radio-button-on" : "radio-button-off"}
                    size={16}
                    color={isApproveRequired === "N" ? "#FF6534" : "rgba(0, 0, 0, 0.3)"}
                    style={{ marginRight: 3 }}
                  />
                  <ItemText>누구나 바로 가입</ItemText>
                </RadioButton>
              </RadioButtonView>
            </ContentItem>
            <ContentItem>
              <ItemTitle>모임 담당자 연락처</ItemTitle>
              <ItemTextInput keyboardType="numeric" placeholder="010-0000-0000" maxLength={13} onChangeText={(phone: string) => setPhoneNumber(phone)} value={phoneNumber} includeFontPadding={false} />
            </ContentItem>
            <ContentItem>
              <ItemTitle>모임 소속 교회</ItemTitle>
              <ItemTextInput
                value={organizationName}
                placeholder="모임이 소속된 교회 또는 담당자가 섬기는 교회명"
                placeholderTextColor="#B0B0B0"
                maxLength={16}
                onChangeText={(name: string) => setOrganizationName(name)}
                onEndEditing={() => setOrganizationName((prev) => prev.trim())}
                returnKeyType="done"
                returnKeyLabel="done"
                includeFontPadding={false}
              />
            </ContentItem>
            {categoryLoading ? (
              <></>
            ) : (
              <ContentItem style={{ borderBottomWidth: 0 }}>
                <ItemTitle>모임 카테고리</ItemTitle>
                {categoryBundle?.map((bundle, index) => (
                  <CategoryView key={index}>
                    {bundle?.map((category, index) => (
                      <CategoryLabel key={index} onPress={() => onPressCategory(category.id)} selected={selectCategory1 === category.id || selectCategory2 === category.id}>
                        <CategoryText selected={selectCategory1 === category.id || selectCategory2 === category.id}>{`${category.thumbnail} ${category.name}`}</CategoryText>
                      </CategoryLabel>
                    ))}
                  </CategoryView>
                ))}
              </ContentItem>
            )}
          </Content>
        </MainView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ClubEditBasics;
