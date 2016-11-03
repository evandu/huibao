(function ($) {
    var jdatatables;

    $("#deleteData").click(function () {
        if (jdatatables) {
            var data = $(".DeleteDatas").filter(":checked");
            if (data.length <= 0) return;
            var params = {};
            for (var i = 0; i < data.length; i++) {
                params['o_' + i] = $(data[i]).val();
            }
            $(".tableLoading").show();
            $.ajax({
                type: "POST",
                url: 'ajaxDelete',
                data: params,
                dataType: 'json'
            }).success(function (items) {
                jdatatables.ajax.reload();
            }).fail(function () {
                jdatatables.ajax.reload();
                alert("删除数据报错")
            })
        }
    })

    function renderTable(options, render) {
        $(".tableLoading").show();
        var p = options.params();
        if (options.pageSize) {
            p.size = options.pageSize
        }
        if (options.pageCur) {
            p.cur = options.pageCur
        }
        $.ajax({
            type: options.method || "GET",
            url: options.url,
            data: p,
            dataType: 'json'
        }).success(function (items) {
            render(options, items);
            $(".tableLoading").hide();
            if(options.renderCallback){
                options.renderCallback(items)
            }
        }).fail(function (data) {
            $(".tableLoading").hide();
            alert(data.msg ||"查询数据报错")
        })
    }

    function dataTable(options, items) {
        jdatatables = $(options.target).DataTable({
            "serverSide": true,
            "ajax": function (data, callback) {
                if (!options.row) {
                    callback({
                        draw: 0,
                        recordsTotal: items.data.total,
                        recordsFiltered: items.data.total,
                        data: items.data.data
                    })
                    options.row = true;
                } else {
                    options.pageSize = data.length;
                    options.pageCur = Math.ceil(data.start / data.length) + 1;
                    renderTable(options, function (opts, i) {
                        callback({
                            recordsTotal: i.data.total,
                            recordsFiltered: i.data.total,
                            data: i.data.data
                        })
                    })
                }
            },
            "columns": options.columns,
            "paging": true,
            "lengthChange": true,
            "searching": false,
            "scrollX": true,
            "ordering": false,
            "showFoot": false,
            "autoWidth": true,
            "pagingType": "full_numbers",
            "bFilter": false,
            "columnDefs": options.columnDefs,
            "language": {
                sEmptyTable: "<b>符合条件的数据为空</b>",
                sInfo: "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
                sInfoEmpty: "显示第 0 至 0 项结果，共 0 项",
                sInfoFiltered: "(filtered from _MAX_ total entries)",
                sInfoThousands: ",",
                sLengthMenu: "显示 _MENU_ 项",
                sLoadingRecords: "数据加载中，请稍后...",
                sProcessing: "加载中...",
                sSearch: "搜索:",
                sZeroRecords: "未找到匹配的元素",
                errMode: function (settings, tn, msg) {
                    console.log(msg)
                },
                oPaginate: {
                    sFirst: "首页",
                    sLast: "尾页",
                    sNext: "下页",
                    sPrevious: "上页"
                },
                oAria: {
                    sSortAscending: ": 以升序排列此列",
                    sSortDescending: ": 以降序排列此列"
                }
            }
        });
    }

    $.fn.extend({
        DataTables: function (opts) {
            if(opts.hiddenCheckbox){

            }else{
                if ( (!opts.columnDefs || opts.columnDefs.length == 0)) {
                    opts.columnDefs =  [{
                        "render": function (data, type, row) {
                            return '<input type="checkbox" class="DeleteDatas" value="' + data + '">'
                        },
                        "targets": 0
                    }]
                }else {
                    opts.columnDefs.push({
                        "render": function (data, type, row) {
                            return '<input type="checkbox" class="DeleteDatas" value="' + data + '">'
                        },
                        "targets": 0
                    })
                }
            }
            renderTable(opts, dataTable)
            $("form").on("submit", function (event) {
                event.preventDefault();
                jdatatables.ajax.reload();
            })
        }
    })
})(jQuery)

