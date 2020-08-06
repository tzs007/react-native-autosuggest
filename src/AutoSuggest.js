import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Button,
} from "react-native";
import { debounce } from "throttle-debounce";
const rnVersion = require("react-native/package.json").version;
// const ds = new FlatList.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })

export default class AutoSuggest extends Component {
  static propTypes = {
    onChangeTextDebounce: PropTypes.number,
    onItemPress: PropTypes.func,
    onChangeText: PropTypes.func,
    rowTextStyles: PropTypes.object,
    rowWrapperStyles: PropTypes.object,
    listStyles: PropTypes.object,
    containerStyles: PropTypes.object,
    textInputStyles: PropTypes.object,
    placeholder: PropTypes.string,
    terms: PropTypes.array,
    clearBtnVisibility: PropTypes.bool,
    maxRow: PropTypes.number,
  };

  static defaultProps = {
    onChangeTextDebounce: 0,
    clearBtnVisibility: false,
    maxRow: 5,
  };

  getInitialStyles() {
    return {
      rowWrapperStyles: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 5,
        paddingRight: 5,
        borderBottomColor: "lightgrey",
        borderBottomWidth: 1,
      },
      rowTextStyles: {},
      clearBtnStyles: {},
      containerStyles: {
        width: 300,
        backgroundColor: "white",
      },
      textInputStyles: {
        backgroundColor: "lightgrey",
        height: 40,
        paddingLeft: 5,
        paddingRight: 5,
        flex: 5,
      },
    };
  }

  constructor(props) {
    super(props);
    this.clearTerms = this.clearTerms.bind(this);
    this.searchTerms = this.searchTerms.bind(this);
    this.setCurrentInput = this.setCurrentInput.bind(this);
    this.onRemoving = this.onRemoving.bind(this);
    this.onItemPress = this.onItemPress.bind(this);
    this.listHeight = 40;
    this.state = {
      results: [],
      currentInput: null,
      isRemoving: null,
      listHeight: new Animated.Value(this.listHeight),
      listViewHeight: 0,
      isLoading: false,
    };
  }
  componentDidMount() {
    // when user hits the return button, clear the terms
    // Keyboard.addListener('keyboardDidHide', () => this.clearTerms())
  }

  setCurrentInput(currentInput) {
    this.setState({ currentInput });
  }

  clearInputAndTerms = () => {
    this.refs.TI.clear();
    this.clearTerms();
  };

  clearTerms() {
    this.setState({ results: [] });
  }

  addAllTerms() {
    this.setState({ results: this.props.terms });
  }

  searchTerms(currentInput) {
    this.setState({ currentInput });
    debounce(300, () => {
      const findMatch = (term1, term2) =>
        term1.toLowerCase().indexOf(term2.toLowerCase()) > -1;
      const results = this.props.terms.filter((eachTerm) => {
        if (findMatch(eachTerm.text, currentInput)) return eachTerm;
      });
      if (results.length > this.props.maxRow) {
        this.setState({
          listViewHeight: this.listHeight * this.props.maxRow,
        });
      } else {
        this.setState({
          listViewHeight: this.listHeight * results.length,
        });
      }

      // this.setState({ isRemoving: results.length < this.state.results.length })
      const inputIsEmpty = !!(currentInput.length <= 0);
      if (inputIsEmpty) {
        this.setState({
          listViewHeight: 0,
        });
      }
      this.setState({
        results: inputIsEmpty ? [] : results,
      }); // if input is empty don't show any results
    })();
  }

  onRemoving() {
    Animated.timing(this.state.listHeight, {
      toValue: this.listHeight * this.state.results.length - 1,
      duration: 1000,
    }).start();
  }

  // copy the value back to the input
  onItemPress(currentInput) {
    this.setCurrentInput(currentInput);
    this.clearTerms();
  }

  getCombinedStyles(styleName) {
    // combine the  initial i.e default styles into one object.
    return { ...this.getInitialStyles()[styleName], ...this.props[styleName] };
  }

  renderRefreshControl = () => {
    this.setState({ isLoading: true });
  };

  renderRow = () => {
    (rowData, sectionId, rowId, highlightRow) => (
      <RowWrapper
        styles={this.getCombinedStyles("rowWrapperStyles")}
        isRemoving={this.state.isRemoving}
      >
        <TouchableOpacity
          activeOpacity={0.5 /* when you touch it the text color grimaces */}
          onPress={() => {
            this.onItemPress(this.state.results[rowId].text);
            this.setState({ listViewHeight: 0 });
            if (this.props.onItemPress)
              this.props.onItemPress(this.state.results[rowId]);
          }}
        >
          <Text style={this.getCombinedStyles("rowTextStyles")}>
            {rowData.text}
          </Text>
        </TouchableOpacity>
      </RowWrapper>
    );
  };

  render() {
    return (
      <View style={this.getCombinedStyles("containerStyles")}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <TextInput
            ref="TI"
            spellCheck={false}
            defaultValue={this.state.currentInput}
            onChangeText={(el) => {
              this.searchTerms(el);
              if (typeof this.props.onChangeText === "function") {
                // debounce(this.props.onChangeTextDebounce, () => this.props.onChangeText(el));
                if (this.state.results.length === 1) {
                  if (
                    el.toLowerCase() == this.state.results[0].text.toLowerCase()
                  ) {
                    this.props.onChangeText(this.state.results[0]);
                  } else {
                    this.props.onChangeText(null);
                  }
                } else {
                  this.props.onChangeText(null);
                }
              }
            }}
            placeholder={this.props.placeholder}
            style={this.getCombinedStyles("textInputStyles")}
          />

          {this.props.clearBtn ? ( // for if the user just wants the default clearBtn
            <TouchableOpacity onPress={() => this.clearInputAndTerms()}>
              {this.props.clearBtn}
            </TouchableOpacity>
          ) : (
            false
          )}

          {!this.props.clearBtn && this.props.clearBtnVisibility ? ( // for if the user passes a custom btn comp.
            <Button
              style={this.getCombinedStyles("clearBtnStyles")}
              title="Clear"
              onPress={() => this.clearInputAndTerms()}
            />
          ) : (
            false
          )}
        </View>
        <Animated.View style={{ height: this.state.listViewHeight }}>
          <FlatList
            data={this.props.terms}
            renderItem={({ item }) => this.renderRow(item)}
            keyExtractor={(item, index) => item.id}
            onRefresh={() => this.renderRefreshControl()}
            refreshing={this.state.isLoading}
            initialNumToRender={8}
          />
        </Animated.View>
      </View>
    );
  }
}

class RowWrapper extends Component {
  constructor(props) {
    super(props);

    this.defaultTransitionDuration = 500;
    this.state = {
      opacity: new Animated.Value(0),
    };
  }
  componentDidMount() {
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: this.defaultTransitionDuration,
    }).start();
  }
  componentWillReceiveProps() {
    if (this.props.isRemoving) {
      Animated.sequence([
        Animated.timing(this.state.opacity, {
          toValue: 0.75,
          duration: 100,
        }),
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: 200,
        }),
      ]).start();
    }
  }

  render() {
    const combinedRowWrapperStyles = {
      opacity: this.state.opacity,
      ...this.props.styles,
    };
    return (
      <TouchableWithoutFeedback>
        <Animated.View style={combinedRowWrapperStyles}>
          {this.props.children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
