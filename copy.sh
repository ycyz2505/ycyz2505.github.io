#!/bin/bash

OUTPUT_FILE="output.md"
# 自动获取当前运行的脚本文件名（自身）
SCRIPT_NAME=$(basename "$0")

> "$OUTPUT_FILE" # 清空或创建输出文件
count=1

# 查找文件，并排除隐藏文件、特定目录、输出文件以及脚本自身
find . -type f \
    -not -path '*/\.*' \
    -not -path '*/node_modules/*' \
    -not -path '*/venv/*' \
    -not -path './js/data/*' \
    -not -path './mc/*' \
    -not -path './old/*' \
    -not -name "$OUTPUT_FILE" \
    -not -name "1.md" \
    -not -name "$SCRIPT_NAME" \
    | sort | while read -r file; do
    
    # 判断是否为纯文本文件
    if file -i "$file" | grep -qEv "charset=binary"; then
        # 去除路径开头的 './'
        filepath="${file#./}"
        
        # 提取文件后缀名，用于 Markdown 代码块的高亮
        filename=$(basename "$filepath")
        if [[ "$filename" == *.* ]]; then
            ext="${filename##*.}"
        else
            ext=""
        fi
        
        # txt 文件不加语言标签
        [[ "$ext" == "txt" ]] && ext=""

        # 写入到 md 文件
        {
            echo "## $count \`$filepath\`"
            echo "\`\`\`$ext"
            cat "$file"
            # 确保文件末尾没有换行符时，``` 不会和代码粘在一行
            echo "" 
            echo "\`\`\`"
            echo ""
        } >> "$OUTPUT_FILE"
        
        ((count++))
    fi
done

echo "提取完成！已保存到当前目录下的 $OUTPUT_FILE"
