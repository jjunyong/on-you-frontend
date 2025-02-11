import React, { useCallback, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import styled from "styled-components/native";
import { ActivityIndicator, Dimensions, FlatList, Platform, StatusBar, useWindowDimensions } from "react-native";
import { useQuery } from "react-query";
import { UserApi, Club, MyClubsResponse, ErrorResponse, MyClub } from "../../api";
import CircleIcon from "../../components/CircleIcon";
import CustomText from "../../components/CustomText";
import { useToast } from "react-native-toast-notifications";

const Loader = styled.SafeAreaView`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-top: ${Platform.OS === "android" ? StatusBar.currentHeight : 0}px;
`;

const Header = styled.View`
  background-color: white;
  padding: 10px 20px;
`;

const Title = styled(CustomText)`
  color: #b0b0b0;
`;

const Break = styled.View`
  border-bottom-width: 1px;
  border-bottom-color: #e9e9e9;
`;

const MyClubBox = styled.TouchableOpacity`
  flex-direction: row;
  width: 100%;
  align-items: center;
  background-color: white;
  padding: 5px 20px;
`;

const MyClubTextBox = styled.View`
  padding-left: 10px;
`;

const MyClubText = styled(CustomText)`
  font-size: 14px;
  line-height: 20px;
  font-family: "NotoSansKR-Medium";
`;

const EmptyView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: white;
`;

const EmptyText = styled(CustomText)`
  font-size: 14px;
  line-height: 20px;
  color: #bdbdbd;
  justify-content: center;
  align-items: center;
`;

const MyClubPage: React.FC<NativeStackScreenProps<any, "ProfileStack">> = ({ navigation: { navigate } }, props) => {
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const {
    isLoading: myClubInfoLoading, // true or false
    data: myClubs,
    refetch: myClubRefetch,
  } = useQuery<MyClubsResponse, ErrorResponse>(["getMyClubs"], UserApi.getMyClubs, {
    onSuccess: (res) => {},
    onError: (error) => {
      console.log(`API ERROR | getMyClubs ${error.code} ${error.status}`);
      toast.show(`${error.message ?? error.code}`, { type: "warning" });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    myClubRefetch();
    setRefreshing(false);
  };

  const goToClubStack = (clubData: Club) => {
    return navigate("ClubStack", {
      screen: "ClubTopTabs",
      clubData: { id: clubData.id },
    });
  };

  const listHeaderComponent = useCallback(
    () => (
      <Header>
        <Title>가입한 모임 리스트</Title>
      </Header>
    ),
    []
  );
  const itemSeparatorComponent = useCallback(() => <Break />, []);
  const renderItem = useCallback(
    ({ item, index }: { item: MyClub; index: number }) => (
      <MyClubBox key={index} onPress={() => goToClubStack(item)}>
        <CircleIcon size={37} uri={item.thumbnail} />
        <MyClubTextBox>
          <MyClubText>{item.name}</MyClubText>
        </MyClubTextBox>
      </MyClubBox>
    ),
    []
  );
  const listEmptyComponent = useCallback(
    () => (
      <EmptyView>
        <EmptyText>{`가입한 모임이 없습니다.`}</EmptyText>
      </EmptyView>
    ),
    []
  );

  return myClubInfoLoading ? (
    <Loader>
      <ActivityIndicator />
    </Loader>
  ) : (
    <FlatList
      contentContainerStyle={{ flexGrow: 1 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyExtractor={(item: MyClub, index: number) => String(index)}
      data={myClubs?.data.filter((item) => item.applyStatus === "APPROVED")}
      ItemSeparatorComponent={itemSeparatorComponent}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={listEmptyComponent}
      stickyHeaderIndices={[0]}
      renderItem={renderItem}
    />
  );
};

export default MyClubPage;
